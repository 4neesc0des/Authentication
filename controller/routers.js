const express = require("express");
const user = require("../model/user");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
require("./passportLocal")(passport);
require("./googleAuth")(passport);

function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    res.set(
      "Cache-control",
      "no-cache, private, no-store,must-revalidate, post-check=0, precheck=0"
    );
    next();
  } else {
    req.flash("error_message", "please Login to continue !");
    res.redirect("/login");
  }
}

router.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("index", { logged: true });
  } else {
    res.render("index", { logged: false });
  }
});

router.get("/login", (req, res) => {
  res.render("login", { csrfToken: req.csrfToken() });
});

router.get("/signup", (req, res) => {
  res.render("signup", { csrfToken: req.csrfToken() });
});

router.post("/signup", async (req, res) => {
  try {
    // get all the value
    const { email, username, password, confirmpassword } = req.body;

    // check if they are empty
    if (!email || !username || !password || !confirmpassword) {
      res.status(422).render("signup", {
        err: "All Field Required !",
        csrfToken: req.csrfToken(),
      });
    } else if (password !== confirmpassword) {
      res.status(422).render("signup", {
        err: "Password Don't Match !",
        csrfToken: req.csrfToken(),
      });
    } else {
      // checking weather user already exist or not
      const existResponse = await user.findOne({
        $or: [{ email: email }, { username: username }],
      });
      if (existResponse) {
        res.render("signup", {
          err: "User Exists, Try Logging In !",
          csrfToken: req.csrfToken(),
        });
      } else {
        bcrypt.genSalt(12, (err, salt) => {
          if (err) throw err;

          bcrypt.hash(password, salt, async (err, hash) => {
            if (err) throw err;

            await user({
              username: username,
              email: email,
              password: hash,
              googleId: null,
              provider: "email",
            }).save((err, data) => {
              if (err) throw err;
              res.redirect("/login");
            });
          });
        });
      }

      // res.render("signup", { err: "All good", csrfToken: req.csrfToken() });
    }
  } catch (error) {
    res.render("signup", { err: error, csrfToken: req.csrfToken() });
  }
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    failureRedirect: "/login",
    successRedirect: "/profile",
    failureFlash: true,
  })(req, res, next);
});

router.get("/logout", (req, res) => {
  req.logout();
  req.session.destroy(function (err) {
    res.redirect("/");
  });
});

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    res.redirect("/profile");
  }
);

router.get("/profile", checkAuth, (req, res) => {
  res.render("profile", {
    username: req.user.username,
    verified: req.user.isVerified,
  });
});

router.use(require("./userRouters"));

module.exports = router;
