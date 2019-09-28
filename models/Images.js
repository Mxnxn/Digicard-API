const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Images = new Schema({
    jwt:{
        require:true,
        type:String
    },
    image:{
        required:true,
        type:String
    }
});

module.exports = mongoose.model("Images",Images);