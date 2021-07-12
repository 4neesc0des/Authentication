const port = process.env.PORT || 8000;
const mongoose = require("mongoose");
const express = require("express");
const app = express();
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
const MemoryStore = require("memorystore")(expressSession);
const passport = require("passport");
const flash = require("connect-flash");

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

//middleware
app.use(express.urlencoded({ extended: true }));

//conn.js
require("./db/conn");

app.use(cookieParser("random"));

app.use(
  expressSession({
    secret: "random",
    resave: true,
    saveUninitialized: false,
    maxAge: 60 * 1000,
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  })
);

app.use(csrf());
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
  res.locals.success_message = req.flash("success_message");
  res.locals.error_message = req.flash("error_message");
  res.locals.error = req.flash("error");

  next();
});

//render
app.use(require("./controller/routers"));

app.listen(port, () => {
  console.log(`Listening to port number ${port}`);
});
