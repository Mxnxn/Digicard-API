const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Logo = new Schema({
    jwt:{
        require:true,
        type:String,
    },
    logo:{
        require:true,
        type:String,
    }
});

module.exports = mongoose.model("Logo",Logo);