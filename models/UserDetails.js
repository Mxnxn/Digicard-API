const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const User = new Schema({
  firmName: {
    type: String,
    required: true
  },
  firmDetail: {
    type: String,
    required: true
  }
  // ,
  // firmOwner:{
  //   required:true,
  //   type:String
  // },
  // firmContact:{
  //   required:true,
  //   type:String
  // },
  // firmAddress:{
  //   required:true,
  //   type:String
  // },
  // firmEmail:{
  //   required:true,
  //   type:String
  // }
});

module.exports = mongoose.model("User", User);
