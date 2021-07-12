const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const resetToken = require("../model/resetTokens");
const user = require("../model/user");
const mailer = require("./sendMail");
const bcryptjs = require("bcryptjs");

function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    res.set(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0"
    );
    next();
  } else {
    req.flash("error_messages", "Please Login to continue !");
    res.redirect("/login");
  }
}

router.get("/user/send-verification-email", checkAuth, async (req, res) => {
  if (req.user.isverified || req.user.provider == "google") {
    res.redirect("/profile");
  } else {
    var token = crypto.randomBytes(32).toString("hex");
    await resetToken({
      token: token,
      email: req.user.email,
    }).save();
    mailer.sendVerifyEmail(req.user.email, token);
    res.render("profile", {
      username: req.user.username,
      verified: req.user.isVerified,
      emailsent: true,
    });
  }
});

router.get("/user/verifyEmail", async (req, res) => {
  const token = req.query.token;
  if (token) {
    var check = await resetToken.findOne({ token: token });
    if (check) {
      var userdata = await user.findOne({ email: check.email });
      userdata.isVerified = true;
      await userdata.save();
      await resetToken.findOneAndDelete({ token: token });
      res.redirect("/profile");
    } else {
      res.render("profile", {
        username: req.user.username,
        isVerified: req.user.isVerified,
        err: "Invalid! token or toke has expired! Try angain",
      });
    }
  } else {
    res.redirect("/profile");
  }
});

router.get("/user/forgot-password", async (req, res) => {
  res.render("forgotPassword", { csrfToken: req.csrfToken() });
});

router.post("/user/forgot-password", async (req, res) => {
  const { email } = req.body;
  var userData = await user.findOne({ email: email });
  console.log(userData);

  if (userData) {
    if (userData.provider === "google") {
      res.render("forgotPassword", {
        csrfToken: req.csrfToken(),
        msg: "User exists with Google acount try resetting your google account password or logging using it.",
        type: "danger",
      });
    } else {
      var token = crypto.randomBytes(32).toString("hex");
      await resetToken({ token: token, email: email }).save();
      mailer.sendResetEmail(email, token);
      res.render("forgotPassword", {
        csrfToken: req.csrfToken(),
        msg: "Reset email sent. check your email for more information",
        type: "success",
      });
    }
  } else {
    res.render("forgotPassword", {
      csrfToken: req.csrfToken(),
      msg: "Alert! No user Exist with this email.",
      type: "danger",
    });
  }
});

router.get("/user/reset-password", async (req, res) => {
  const token = req.query.token;
  if (token) {
    var check = await resetToken.findOne({ token: token });
    if (check) {
      res.render("forgotPassword", {
        csrfToken: req.csrfToken(),
        reset: true,
        email: check.email,
      });
    } else {
      res.render("forgotPassword", {
        csrfToken: req.csrfToken(),
        msg: "Token Tempered or Expired!",
        type: "danger",
      });
    }
  } else {
    res.redirect("/login");
  }
});

router.post("/user/reset-password", async (req, res) => {
  const { password, password2, email } = req.body;
  // console.log(password);
  // console.log(password2);
  if (!password || !password2 || password2 !== password) {
    res.render("forgotPassword", {
      csrfToken: req.csrfToken(),
      reset: true,
      email: email,
      err: "Alert!! Passwords don't match",
    });
  } else {
    const salt = await bcryptjs.genSalt(12);
    if (salt) {
      var hash = await bcryptjs.hash(password, salt);
      await user.findOneAndUpdate(
        {
          email: email,
        },
        { $set: { password: hash, isVerified: false } }
      );
      res.redirect("/login");
    } else {
      res.render("forgot-password.ejs", {
        csrfToken: req.csrfToken(),
        reset: true,
        err: "Unexpected Error Try Again",
        email: email,
      });
    }
  }
});

module.exports = router;

// await user({
//   username: username,
//   email: email,
//   password: hash,
//   googleId: null,
//   provider: "email",
// }).save((err, data) => {
//   if (err) throw err;
//   res.redirect("/login");
// });
