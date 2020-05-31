var express = require("express");
var PORT = process.env.PORT || 8080;
var session = require("express-session");
var passport = require("passport");
var SequelizeStore = require("connect-session-sequelize")(session.Store);
var app = express();
var db = require("./models");
// Serve static content for the app from the "public" directory in the application directory.
app.use(express.static("public"));

// Parse application body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// include session middleware
app.use(
  session({
    secret: "keboard cat",
    store: new SequelizeStore({
      db: db.sequelize,
    }),
    resave: false,
    saveUninitialized: false,
    // set the idel time for 5 min before logging out the user
    cookie: { maxAge: 300000 },
    rolling: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Import routes and give the server access to them.

require("./routes/api-routes")(
  app,
  passport,
  isAuthenticatedMiddleware,
  isNotAuthenticatedMiddleware
);

require("./routes/html-routes")(
  app,
  isAuthenticatedMiddleware,
  isNotAuthenticatedMiddleware
);
// Add User Restriction
function isAuthenticatedMiddleware() {
  return (req, res, next) => {
    // console.log(
    //   `req.session.passport.user: ${JSON.stringify(req.session.passport)}`
    // );

    if (req.isAuthenticated()) return next();
    res.redirect("/login");
  };
}

function isNotAuthenticatedMiddleware() {
  return (req, res, next) => {
    // console.log(
    //   `req.session.passport.user: ${JSON.stringify(req.session.passport)}`
    // );

    if (!req.isAuthenticated()) return next();
    res.redirect("/");
  };
}
// { force: true }
// Start our server so that it can begin listening to client requests.
db.sequelize.sync().then(() => {
  app.listen(PORT, function () {
    // Log (server-side) when our server has started
    console.log("Server listening on: http://localhost:" + PORT);
  });
});
