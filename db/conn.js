const mongoURI = require("../config/monkoKEY");
const mongoose = require("mongoose");
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Connected successfully");
  })
  .catch((err) => {
    console.log("Error in Conn.js part " + err);
  });
