const Joi = require("@hapi/joi");

const registerValidation = data => {
	const schema = Joi.object({
		name: Joi.string()
			.min(2)
			.required(),
		email: Joi.string()
			.required()
			.email(),
		password: Joi.string()
			.min(6)
			.required(),
		phonenumber: Joi.string()
			.min(9)
			.required(),
		paid: Joi.string().required(),
		years: Joi.string().required(),
		paymentID: Joi.string().required(),
		paymentDetailID: Joi.string().required()
	});
	return schema.validate(data);
};

const loginValidation = data => {
	const loginSchema = Joi.object({
		usrEmail: Joi.string()
			.required()
			.email(),
		usrPassword: Joi.string()
			.min(6)
			.required()
	});
	return loginSchema.validate(data);
};

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
