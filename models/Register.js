const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Register = new Schema({
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true
	},
	pass: {
		type: String,
		required: true
	},
	phone: {
		type: String,
		required: true
	},
	paid: {
		type: String,
		required: true
	},
	years: {
		type: String,
		required: true
	},
	paymentID: { type: String, required: true },
	paymentDetailID: { type: String, required: true }
});

module.exports = mongoose.model("Register", Register);
