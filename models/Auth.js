const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Auth = new Schema({
  jwtToken: {
    type: String,
    required: true
  },
});

module.exports = mongoose.model("Auth", Auth);
