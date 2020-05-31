// Dependencies
// =============================================================
var db = require("../models");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
require("dotenv").config();
///////////////Twilio Library///////////////////
var twilio = require("twilio");
var VoiceResponse = twilio.twiml.VoiceResponse;
const path = require("path");
const multer = require("multer");
var aws = require("aws-sdk");
var multerS3 = require("multer-s3");
aws.config.update({
  // to get the secret key and access id :
  // 1. from aws console go to 'my security credentials' by clicking on you account name
  // 2. then create new access key from there
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  accessKeyId: process.env.ACCESS_KEY_ID,
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
      cb(
        null,
        "ProfileImgs/" + file.fieldname + "-" + req.user.id + "-" + Date.now()
      );
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

function voiceResponse(toNumber) {
  // Create a TwiML voice response
  const twiml = new VoiceResponse();

  if (toNumber) {
    // Wrap the phone number or client name in the appropriate TwiML verb
    // if is a valid phone number
    const attr = isAValidPhoneNumber(toNumber) ? "number" : "client";

    const dial = twiml.dial({
      callerId: "+19169995403",
    });
    dial[attr]({}, toNumber);
  } else {
    twiml.say("Thanks for calling!");
  }

  return twiml.toString();
}

function isAValidPhoneNumber(number) {
  return /^[\d\+\-\(\) ]+$/.test(number);
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
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          username: req.body.username,
          password: hashedPassword,
        })
          .then(() => {
            res.send(true);
          })
          .catch((err) => {
            console.log(err);
            err.errors[0].message.includes("username must be unique")
              ? res.send("User Already Exists!!")
              : res.send(false);
          });
      } catch {
        res.status(500).end();
      }
    } else {
      res.redirect("/");
    }
  });

  app.post("/addNote", isAuthenticatedMiddleware(), async (req, res) => {
    console.log("//////////////Adding Comments");
    db.Comments.create({
      UserId: req.user.id,
      TicketId: req.body.TicketId,
      commentText: req.body.commentText,
    })
      .then(() => {
        res.send(true);
      })
      .catch((err) => {
        console.log("error in adding comment: ", err);
        res.send(false);
      });
  });

  app.get("/allTickets", isAuthenticatedMiddleware(), async (req, res) => {
    db.Tickets.findAll({
      where: { UserId: req.user.id },
      attributes: ["id", "ticketTitle", "ticketText", "status", "createdAt"],
      include: [
        {
          model: db.Customers,
          attributes: ["firstName", "lastName"],
        },
      ],
    })
      .then((result) => {
        var resArray = [];
        for (row of result) {
          resArray.push(row.dataValues);
        }
        res.send(resArray);
      })
      .catch((error) => {
        console.log("/////feching all tickets Error: ", error);
        res.status(500).end();
      });
  });

  app.get(
    "/ticket_comments/:id",
    isAuthenticatedMiddleware(),
    async (req, res) => {
      db.Comments.findAll({
        attributes: ["commentText", "createdAt"],
        where: { TicketId: req.params.id },
      })
        .then((result) => {
          var resArray = [];
          for (row of result) {
            resArray.push({ comment: row.commentText, date: row.createdAt });
          }
          res.json(resArray);
        })
        .catch((err) => {
          res.status(500).end();
        });
    }
  );

  app.get("/all_Customers", isAuthenticatedMiddleware(), async (req, res) => {
    db.Customers.findAll({
      where: { UserId: req.user.id },
    })
      .then((result) => {
        resArray = [];
        for (row of result) {
          resArray.push(row.dataValues.email);
        }
        res.send(resArray);
      })
      .catch(() => {
        res.status(500).end();
      });
  });

  app.get("/statistics", isAuthenticatedMiddleware(), async (req, res) => {
    console.log("/////////statistics////////");
    db.Tickets.findAll({
      where: { UserId: req.user.id },
    })
      .then((results) => {
        var OpenCount = 0;
        var ClosedCount = 0;
        var tickets;
        for (row of results) {
          tickets = results.length;
          if (row.dataValues.status === "open") {
            OpenCount++;
          } else {
            ClosedCount++;
          }
        }
        db.Customers.findAll({
          where: { UserId: req.user.id },
        })
          .then((result) => {
            res.json({
              tickets: tickets,
              open: OpenCount,
              closed: ClosedCount,
              Customers: result.length,
            });
          })
          .catch(() => {
            res.status(500).end();
          });
      })
      .catch((err) => {
        console.log("errror :", err);
        res.status(500).end();
      });
  });

  app.post("/Newticket", isAuthenticatedMiddleware(), async (req, res) => {
    db.Customers.findOne({
      where: { email: req.body.CustomerEmail },
    })
      .then((result) => {
        db.Tickets.create({
          ticketTitle: req.body.ticketTitle,
          ticketText: req.body.ticketText,
          status: "open",
          CustomerId: result.dataValues.id,
          UserId: req.user.id,
        })
          .then(() => {
            res.send(true);
          })
          .catch((err) => {
            console.log("New ticket err :", err);
            res.send(false);
          });
      })
      .catch((err) => {
        console.log("New ticket error :", err);
        res.status(500).end();
      });
  });

  app.post("/closeTicket", isAuthenticatedMiddleware(), async (req, res) => {
    db.Tickets.update(
      {
        status: "closed",
      },
      {
        where: { id: req.body.id },
      }
    )
      .then(() => {
        res.send(true);
      })
      .catch(() => {
        res.send(false);
      });
  });

  app.post("/upload", isAuthenticatedMiddleware(), async (req, res) => {
    console.log("///////////upload:");
    db.Users.findOne({
      where: { id: req.user.id },
    }).then(async (result) => {
      upload(req, res, function (err) {
        if (err) {
          err === "Error: Images Only"
            ? res.json({ msg: err })
            : res.json({ msg: String(err).split("MulterError: ")[1] });
        } else {
          db.Users.update(
            {
              profImg: req.file.location,
            },
            {
              where: { id: req.user.id },
            }
          ).then(() => {
            console.log("//////////sending response pack", req.file.location);
            res.json({ msg: "Updated", img: req.file.location });
          });
          // }
        } /////////////
      });
    });
  });

  // Twilio Token Route
  app.get("/token", isAuthenticatedMiddleware(), async (req, res) => {
    const AccessToken = require("twilio").jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;
    // Used when generating any kind of tokens
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioApiKey = process.env.API_KEY_SID;
    const twilioApiSecret = process.env.API_KEY_SECRET;
    // Used specifically for creating Voice tokens
    const outgoingApplicationSid = process.env.TWILIO_APP_SID;
    const identity = "user";
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: outgoingApplicationSid,
      incomingAllow: true, // Optional: add to allow incoming calls
    });

    // Create an access token which we will sign and return to the client,
    // containing the grant we just created
    const token = new AccessToken(
      twilioAccountSid,
      twilioApiKey,
      twilioApiSecret
    );
    token.addGrant(voiceGrant);
    token.identity = identity;
    // Serialize the token to a JWT string
    res.send(token.toJwt());
  });
  //  Twilio App will send request to this route once the client/broswer initiate call request
  app.post("/voice", (req, res) => {
    res.set("Content-Type", "text/xml");
    res.send(voiceResponse(req.body.To));
  });

  // post personal Info in settings page
  app.post(
    "/update-personal",
    isAuthenticatedMiddleware(),
    async (req, res) => {
      // console.log("Personal :", req.body);
      db.Users.update(
        {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.Email,
        },
        {
          where: { id: req.user.id },
        }
      )
        .then(() => {
          res.send(true);
        })
        .catch(() => {
          res.send(false);
        });
    }
  );

  app.post("/update-profile", isAuthenticatedMiddleware(), async (req, res) => {
    db.Users.findOne({
      where: { id: req.user.id },
    }).then(async (result) => {
      if (!result) {
        return res.send(false);
      }

      try {
        if (
          await bcrypt.compare(
            req.body.currentPassword,
            result.dataValues.password
          )
        ) {
          /////////////////////
          try {
            var NewPassword = await bcrypt.hash(req.body.newPassword, 10);
            db.Users.update(
              {
                password: NewPassword,
              },
              {
                where: { id: req.user.id },
              }
            )
              .then(() => {
                res.send(true);
              })
              .catch((err) => {
                res.status(500).end();
              });
          } catch {
            res.status(500).end();
          }
          /////////////////////////
        } else {
          res.send(false);
        }
      } catch {
        res.status(500).end();
      }
    });
  });

  app.get("/allSpecialists", isAuthenticatedMiddleware(), async (req, res) => {
    db.Users.findAll({
      attributes: ["firstName", "lastName", "email"],
      // Execlude the admin from the search
      where: { username: { [Op.ne]: "admin" } },
    })
      .then((result) => {
        var resArray = [];
        for (row of result) {
          resArray.push(row.dataValues);
        }
        res.send(resArray);
      })
      .catch(() => {
        res.status(500).end();
      });
  });

  app.get("/allCustomers", isAuthenticatedMiddleware(), async (req, res) => {
    db.Customers.findAll({
      where: { UserId: req.user.id },
      attributes: [
        "firstName",
        "lastName",
        "address",
        "city",
        "state",
        "zipCode",
        "phone",
        "email",
      ],
    })
      .then((result) => {
        var resArray = [];
        for (row of result) {
          resArray.push(row.dataValues);
        }
        res.send(resArray);
      })
      .catch(() => {
        res.status(500).end();
      });
  });

  app.post("/newCustomer", isAuthenticatedMiddleware(), async (req, res) => {
    db.Customers.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      phone: req.body.phone,
      email: req.body.email,
      UserId: req.user.id,
    })
      .then(() => {
        res.send(true);
      })
      .catch((err) => {
        console.log(err);
        err.errors[0].message.includes("username must be unique")
          ? res.send("User Already Exists!!")
          : res.send(false);
      });
  });
};
