var db = require("../models");

module.exports = function (
  app,
  isAuthenticatedMiddleware,
  isNotAuthenticatedMiddleware
) {
  app.get("/", isAuthenticatedMiddleware(), (req, res) => {
    db.Users.findOne({
      where: { id: req.user.id },
    }).then(async (result) => {
      CurrentUser = req.user.username;
      ProfileImage = result.dataValues.profImg;
      if (req.user.username === "admin") {
        console.log("returning admin......");
        res.render("admin");
      } else {
        res.render("dashboard", {
          currentUser: req.user.username,
          img: result.dataValues.profImg,
          userFirstName: result.dataValues.firstName,
          userLastName: result.dataValues.lastName,
        });
      }
    });
  });

  app.get("/login", isNotAuthenticatedMiddleware(), (req, res) => {
    res.render("login");
  });

  app.get("/contacts", isAuthenticatedMiddleware(), (req, res) => {
    db.Users.findOne({
      where: { id: req.user.id },
    }).then(async (result) => {
      console.log("//////uploads", result.dataValues.profImg);
      res.render("contacts", {
        img: result.dataValues.profImg,
        currentUser: req.user.username,
        userFirstName: result.dataValues.firstName,
        userLastName: result.dataValues.lastName,
      });
    });
  });

  app.get("/tickets", isAuthenticatedMiddleware(), (req, res) => {
    db.Users.findOne({
      where: { id: req.user.id },
    }).then(async (result) => {
      console.log("//////uploads", result.dataValues.profImg);
      res.render("tickets", {
        img: result.dataValues.profImg,
        currentUser: req.user.username,
        userFirstName: result.dataValues.firstName,
        userLastName: result.dataValues.lastName,
      });
    });
  });

  app.get("/settings", isAuthenticatedMiddleware(), (req, res) => {
    db.Users.findOne({
      where: { id: req.user.id },
    }).then(async (result) => {
      res.render("settings", {
        img: result.dataValues.profImg,
        currentUser: req.user.username,
        userFirstName: result.dataValues.firstName,
        userLastName: result.dataValues.lastName,
      });
    });
  });

  app.get("/logout", function (req, res) {
    req.logout();
    req.session.destroy();
    res.render("login");
  });
};
