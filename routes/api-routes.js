// Dependencies
// =============================================================
var db = require("../models");
const bcrypt = require("bcrypt");

const path = require("path");
const multer = require("multer");
var aws = require("aws-sdk");
var multerS3 = require("multer-s3");
aws.config.update({
  // to get the secret key and access id :
  // 1. from aws console go to 'my security credentials' by clicking on you account name
  // 2. then create new access key from there
  secretAccessKey: "bTs9L7H+eAsyIgMiF7CAoiVlN9yr6f10AhNDUDA5",
  accessKeyId: "AKIAJC4JO4OYKALLXDUA",
  region: "us-east-2",
});
var s3 = new aws.S3();
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "images-test-hss",
    acl: "public-read", // make sure the permissions on S3 buckets not blocking public access
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname + "-" + req.user.id });
    },
    key: function (req, file, cb) {
      cb(null, "ProfileImgs/" + file.fieldname + "-" + req.user.id);
    },
  }),
  limits: { fileSize: 1000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("myImage");

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Error: Images Only");
  }
}

module.exports = function (
  app,
  passport,
  isAuthenticatedMiddleware,
  isNotAuthenticatedMiddleware
) {
  app.post("/login", (req, res) => {
    db.Users.findOne({
      where: { username: req.body.username },
    }).then(async (result) => {
      if (!result) {
        return res.send(false);
      }

      try {
        if (
          await bcrypt.compare(req.body.password, result.dataValues.password)
        ) {
          req.login(
            { username: result.dataValues.username, id: result.dataValues.id },
            function (err) {
              if (err) throw err;

              res.send(true);
            }
          );
        } else {
          res.send(false);
        }
      } catch {
        res.status(500).end();
      }
    });
    passport.serializeUser(function (user_Name, done) {
      done(null, user_Name);
    });

    passport.deserializeUser(function (user_Name, done) {
      done(null, user_Name);
    });
  });

  app.post("/addUser", isAuthenticatedMiddleware(), async (req, res) => {
    if (req.user.username === "admin") {
      try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        db.Users.create({
          username: req.body.username,
          password: hashedPassword,
        }).then(() => {
          res.send(true);
        });
      } catch {
        res.status(500).end();
      }
    } else {
      res.redirect("/");
    }
  });

  app.post("/upload", isAuthenticatedMiddleware(), async (req, res) => {
    db.Users.findOne({
      where: { id: req.user.id },
    }).then(async (result) => {
      upload(req, res, function (err) {
        if (err) {
          res.render("settings", {
            msg: err,
            img: result.dataValues.profImg,
          });
          String(err).split("MulterError: ")[1];
        } else {
          if (req.file == undefined) {
            res.render("settings", {
              msg: "No file selected!",
              img: result.dataValues.profImg,
            });
          } else {
            db.Users.update(
              {
                profImg: req.file.location,
              },
              {
                where: { id: req.user.id },
              }
            ).then(() => {
              res.render("settings", {
                msg: "file uploaded",
                img: req.file.location,
              });
            });
          }
        }
      });
    });
  });
};
