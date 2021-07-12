const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    require: true,
  },
  password: {
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },

  googleId: {
    type: String,
  },

  provider: {
    type: String,
    require: true,
  },
});

module.exports = mongoose.model("User", userSchema);
