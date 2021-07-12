var googleStrategy = require("passport-google-oauth20").Strategy;
const user = require("../model/user");
const clientId = require("../config/googleData").clientId;
const clientSecreT = require("../config/googleData").clientSecret;

module.exports = function (passport) {
  passport.use(
    new googleStrategy(
      {
        clientID: clientId,
        clientSecret: clientSecreT,
        callbackURL: "http://localhost:8000/google/callback",
      },
      async function (accessToken, refreshToken, profile, done) {
        console.log(profile.emails[0].value);
        console.log(profile);

        //find if the user exist  with this mail or not

        await user.findOne(
          { email: profile.emails[0].value },
          async (err, data) => {
            if (err) throw err;
            if (data) {
              //user exist
              return done(null, data);
            } else {
              //user not exist already
              await user({
                username: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                password: null,
                provider: "google",
                isVerified: true,
              }).save((err, data) => {
                // if (err) throw err;
                return done(null, data);
              });
            }
          }
        );
      }
    )
  );

  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    user.findById(id, function (err, user) {
      done(err, user);
    });
  });
};
