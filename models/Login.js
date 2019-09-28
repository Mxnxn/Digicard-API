const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Login = new Schema({
	email: {
		type: String,
		required: true
	},
	pass: {
		type: String,
		required: true
	},
	jwt: {
		type: String,
		required: true
	},
	firmName: {
		type: String
	},
	firmDetail: {
		type: String
	},
	contactPerson: {
		type: String
	},
	contactNumber: {
		type: String
	},
	contactNumber2: {
		type: String
	},
	contactEmail: {
		type: String
	},
	contactAddress: {
		type: String
	},
	firmLogo: [Schema.Types.ObjectId, (ref = "Logo")],
	firmImages: [Schema.Types.ObjectId, (ref = "Images")],
	ownerFB: { type: String },
	ownerInsta: { type: String },
	ownerTweeter: { type: String },
	ownerLinkedIn: { type: String },
	ownerPintrest: { type: String }
});

module.exports = mongoose.model("Login", Login);
