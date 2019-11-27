const express = require("express");
const app = express.Router();
const User = require("../models/UserDetails");
const jwt = require("jsonwebtoken");
const Auth = require("../models/Auth");
const Register = require("../models/Register");
const Login = require("../models/Login");
const Images = require("../models/Images");
const Logo = require("../models/Logo");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const log4js = require("log4js");
log4js.configure({
	appenders: { api: { type: "file", filename: "error.log" } },
	categories: { default: { appenders: ["api"], level: "info" } }
});

const logger = log4js.getLogger("api");

const {
	registerValidation,
	loginValidation
} = require("../helpers/validation");
const headerAuth = require("../helpers/headerAuth");

app.all("/*", (req, res, next) => {
	req.app.locals.layout = "index";
	next();
});

app.get("/", (req, res) => {
	const post = "TheDigicard";
	res.render("index/content", { title: post });
});

// app.get("/upload/:firmName/:firmDetail",(req,res)=>{
//   const mUser = User({
//     firmName: req.params.firmName,
//     firmDetail: req.params.firmDetail
//   });
//   mUser.save().then(data => {
//     jwt.sign(
//       { id: data._id },
//       process.env.SECRET_KEY,
//   { expiresIn: 120 } //! for EXPIRATION,
//       (err, token) => {
//         if (err) res.send(err);
//         const mAuth = Auth({
//           jwtToken: token,
//           Date: new Date(),
//           jwtName: data.firmName
//         });
//         mAuth.save();
//         json = {
//           token: `${token}`
//         };
//         res.json(json);
//       }
//     );
// });
// });

//! FOR REGISTERING NEW USER
app.post("/api/1.1/register", headerAuth, async (req, res) => {
	logger.info("\n\n");
	logger.warn("request for /register with " + req.ip);
	const { error } = registerValidation(req.body);
	if (error) {
		logger.error(
			"requested for /register with " +
				req.ip +
				" : generats error - " +
				error
		);
		res.json({ error: error.details[0].message });
		return;
	}

	try {
		const salt = await bcrypt.genSalt(10);
		const hashPassword = await bcrypt.hash(req.body.password, salt);

		//! REGISTERATION INFORMATION TO MONGODB
		const mObj = Register({
			name: req.body.name,
			email: req.body.email,
			pass: hashPassword,
			phone: req.body.phonenumber,
			paid: req.body.paid,
			years: req.body.years,
			paymentID: req.body.paymentID,
			paymentDetailID: req.body.paymentDetailID
		});

		if (req.body.years == "1") {
			time = 31536000;
		} else if (req.body.years == "2") {
			time = 63072000;
		} else if (req.body.years == "3") {
			time = 94608000;
		}
		mObj.save()
			.then(data => {
				//! GENERATING TOKEN FROM _id
				jwt.sign(
					{ id: data._id },
					process.env.SECRET_KEY,
					{ expiresIn: time },
					(err, token) => {
						//! CHECKING FOR ERROR
						if (err) {
							logger.error(
								"requested for /register with " +
									req.ip +
									" : generates error - " +
									err
							);
							res.json({ error: "Failure" });
							return;
						}
						//! STORING email,pass,jwttoken TO MONGODB FOR LOGIN
						const mLogin = Login({
							jwt: token,
							email: data.email,
							pass: data.pass
						});
						mLogin
							.save()
							.then(data => {
								//! IF EVERYTHING REMAINS SUCESSFUL
								const mAuth = Auth({
									jwtToken: token
								});
								mAuth.save().then(data => {
									logger.info(
										"requested for /register with " +
											req.ip +
											" : Transaction Successful. "
									);
									res.json({ error: "Successful" });
									return;
								});
							})
							.catch(err => {
								logger.info(
									"requested for /register with " +
										req.ip +
										" : generated Error : error data storing in Collection  "
								);
								res.json({ error: "Failure" });
								return;
							});
					}
				);
			})
			.catch(err => {
				logger.error(
					"requested for /register with " +
						req.ip +
						" : generates error - " +
						err
				);
				res.json({ error: "Failure" });
				return;
			});
	} catch (err) {
		logger.error(
			"requested for /register with " +
				req.ip +
				" : generates error - " +
				err
		);
		res.json({ error: "Failure" });
		return;
	}
});

app.post("/api/1.1/ExistingUser", headerAuth, async (req, res) => {
	logger.info("\n\n");
	logger.warn("request for /ExistingUser with " + req.ip);
	await Register.findOne({ email: req.body.email })
		.then(data => {
			if (data != null) {
				logger.info(
					`request for /ExistingUser but ${req.ip} is Exist.`
				);
				res.json({ result: "Existed" });
				return;
			} else {
				logger.info(`request for /ExistingUser and ${req.ip} is new.`);
				res.json({ result: "New" });
				return;
			}
		})
		.catch(err => {
			logger.error(
				"requested for /ExistingUser with " + req.ip + " : " + err
			);
			res.json({ result: "Failure" });
			return;
		});
});

app.post("/api/1.1/updatePaymentDetails", headerAuth, async (req, res) => {
	logger.info("\n\n");
	logger.warn("request for /updatePaymentDetails with " + req.ip);
	await Register.findOne({ email: req.body.email })
		.then(Data => {
			if (Data != null) {
				Data.paid = "true";
				Data.save().then(data => {
					logger.info(
						"requested for /updatePaymentDetails and updating " +
							req.ip +
							"'s Transaction."
					);
					res.json({ result: "Successful" });
					return;
				});
			} else {
				logger.error(
					"requested for /updatePaymentDetails with " +
						req.ip +
						" : Failed Transaction "
				);
				res.json({ result: "Failure" });
				return;
			}
		})
		.catch(err => {
			logger.error(
				"requested for /updatePaymentDetails with " +
					req.ip +
					" : generates Error : " +
					err
			);
			res.json({ result: "Failure" });
			return;
		});
});

//! FOR LOGIN
app.post("/api/1.1/user", headerAuth, async (req, res) => {
	logger.info("\n\n");
	logger.warn("requested for /user with " + req.ip);
	res.setHeader("Content-Type", "application/json");
	const { error } = loginValidation(req.body);
	if (error) {
		logger.error(
			"requested for /user with " +
				req.ip +
				" : generates Error : " +
				error
		);
		res.json({ result: error.details[0].message });
		return;
	}
	await Register.findOne({ email: req.body.usrEmail })
		.then(data => {
			if (data != null) {
				if (data.paid == "false") {
					logger.warn(
						"requested for /user and " +
							req.ip +
							" is trying to login without paying."
					);
					res.json({ result: "NotPaid" });
					return;
				}
				if (data.paid == "true") {
					Login.findOne({ email: req.body.usrEmail })
						.then(data => {
							if (data != null) {
								bcrypt.compare(
									req.body.usrPassword,
									data.pass,
									(err, result) => {
										if (result) {
											Auth.findOne({ jwtToken: data.jwt })
												.then(authData => {
													if (authData != null) {
														logger.info(
															"requested for /user and " +
																req.ip +
																" has entered Valid Transaction."
														);
														res.json({
															result:
																"Successful",
															token: data.jwt,
															userid: authData._id
														});
														return;
													} else {
														logger.error(
															"requested for /user and " +
																req.ip +
																" JWT Token ERROR"
														);
														res.json({
															result: "Failure"
														});
														return;
													}
												})
												.catch(error => {
													logger.error(
														"requested for /user and " +
															req.ip +
															" : generates Error : " +
															error
													);
													res.json({
														result: "Failure"
													});
													return;
												});
										} else {
											logger.error(
												"requested for /user and " +
													req.ip +
													" has entered Invalid Credential "
											);
											res.json({
												result: "Invalid Credential"
											});
											return;
										}
									}
								);
							} else {
								logger.error(
									"requested for /user and " +
										req.ip +
										" and /user Collection returning null. "
								);
								res.json({ result: "Failure" });
								return;
							}
						})
						.catch(err => {
							logger.error(
								"requested for /user and " +
									req.ip +
									" : generates Error : collection error : " +
									err
							);
							res.json({ result: "Failure" });
							return;
						});
				}
			} else {
				logger.error(
					"requested for /user and " +
						req.ip +
						" : User Data Doesn't Exist."
				);
				res.json({ result: "User Doesn't Exist" });
				return;
			}
		})
		.catch(err => {
			logger.error(
				"requested for /user and " +
					req.ip +
					" : generates Error : " +
					err
			);
			res.json({ result: "Failure" });
			return;
		});
});

app.post("/api/1.1/upload", headerAuth, async (req, res) => {
	logger.info("\n\n");
	logger.warn("requested for /upload with " + req.ip);
	await Login.findOne({ jwt: req.body.userToken })
		.then(data => {
			(data.firmName = req.body.firmName),
				(data.firmDetail = req.body.firmDetail),
				(data.contactPerson = req.body.contactPerson),
				(data.contactNumber = req.body.contactNumber),
				(data.contactNumber2 = req.body.contactNumber2),
				(data.contactEmail = req.body.contactEmail),
				(data.contactAddress = req.body.contactAddress),
				(data.ownerWeb = req.body.ownerWeb);
			data.save().then(updatedData => {
				logger.info(
					"requested for /upload with data sent to " +
						req.ip +
						" : successful"
				);
				res.json({
					result: "Successful",
					"user-token": updatedData.jwt
				});
				return;
			});
		})
		.catch(err => {
			logger.error(
				"requested for /upload and " +
					req.ip +
					" : generated Error : " +
					err
			);
			res.json({ result: "Failure" });
			return;
		});
});

app.post("/api/1.1/getData", headerAuth, async (req, res) => {
	logger.info("\n\n");
	logger.warn("request for /getData with " + req.ip);
	await Login.findOne({ jwt: req.body.userToken })
		.then(data => {
			if (data != null) {
				logger.info(
					"request for /getData and data sent to " +
						req.ip +
						" successful."
				);
				res.json({
					firmName: data.firmName,
					firmDetail: data.firmDetail,
					contactPerson: data.contactPerson,
					contactEmail: data.contactEmail,
					contactAddressStreet: data.contactAddressStreet,
					contactAddress: data.contactAddress,
					contactNumber: data.contactNumber,
					contactNumber2: data.contactNumber2,
					ownerWeb: data.ownerWeb
				});
				return;
			} else {
				logger.error(
					"request for /getData with " +
						req.ip +
						" : It might be first time"
				);
				res.json({ result: "FirstTime" });
				return;
			}
		})
		.catch(err => {
			logger.error(
				"request for /getData and " +
					req.ip +
					" : generated Error : " +
					err
			);
			res.json({ result: "Failure" });
			return;
		});
});

app.post("/api/1.1/getSocialData", headerAuth, async (req, res) => {
	logger.info("\n\n");
	logger.warn("request for /getSocialData with " + req.ip);
	await Login.findOne({ jwt: req.body.userToken })
		.then(data => {
			if (data != null) {
				logger.info(
					"request for /getSocialData and data sent to " +
						data.email +
						" Successful."
				);
				res.json({
					ownerFB: data.ownerFB,
					ownerInsta: data.ownerInsta,
					ownerTweeter: data.ownerTweeter,
					ownerLinkedIn: data.ownerLinkedIn,
					ownerPintrest: data.ownerPintrest
				});
				return;
			} else {
				logger.error(
					"request for /getSocialData and " +
						req.ip +
						" It might for firsttime."
				);
				res.json({ result: "FirstTime" });
				return;
			}
		})
		.catch(err => {
			logger.error(
				"request for /getSocialData and " +
					req.ip +
					" : generated Error : error from collection : " +
					err
			);
			res.json({ result: "Failure" });
			return;
		});
});

//! for LOGO
app.post("/api/1.1/uploadlogo", headerAuth, async (req, res) => {
	logger.info("\n\n");
	logger.warn("request for /uploadlogo with " + req.ip);
	try {
		await Login.findOne({ jwt: req.body.token })
			.then(object => {
				let extension = req.body.filetype;
				extension = extension.split("/");
				let filename =
					object._id + "-" + Date.now() + "." + extension[1];
				let filepath = "public/uploads/" + object._id;
				if (!fs.existsSync(filepath)) {
					fs.mkdirSync(filepath);
				} else {
					fs.readdirSync(filepath).forEach((file, index) => {
						fs.unlinkSync(filepath + "/" + file);
						Logo.deleteOne({ logo: file }).then(data => {});
					});
				}
				fs.writeFile(
					filepath + "/" + filename,
					req.body.image,
					"base64",
					function(err) {
						if (err) {
							logger.error(
								"request for /uploadlogo and " +
									req.ip +
									" : generated Error : failed to create file : " +
									err
							);
						}
					}
				);
				mLogo = new Logo({
					jwt: object.jwt,
					logo: filename
				});
				mLogo
					.save()
					.then(saved => {
						object.firmLogo = saved._id;
						object.save().then(data => {
							logger.info(
								"request for /uploadlogo and  " +
									req.ip +
									" has uploaded logo"
							);
							res.json({ result: "Successful" });
							return;
						});
					})
					.catch(err => {
						logger.error(
							"request for /uploadlogo and " +
								req.ip +
								" : generated Error : logo Upload Failed : " +
								err
						);
						res.json({ result: "Failure" });
						return;
					});
			})
			.catch(err => {
				logger.error(
					"request for /uploadlogo and " +
						req.ip +
						" : generated Error : didn't got data " +
						err
				);
				res.json({ result: "Failure" });
				return;
			});
	} catch (err) {
		logger.error(
			"request for /uploadlogo and " +
				req.ip +
				" : generated Error : " +
				err
		);
		res.json({ result: "Failure" });
		return;
	}
});

//! FOR MULTIPLE FILE UPLOAD
app.post("/api/1.1/uploadMultipleFiles", headerAuth, async (req, res) => {
	logger.info("\n\n");
	logger.warn("request for /uploadMultipleFiles with " + req.ip);
	const json = req.body;
	let extension = [],
		file = [];
	await Login.findOne({ jwt: req.body.token })
		.then(async object => {
			filepath = "public/uploadImages/" + object._id;
			if (!fs.existsSync(filepath)) {
				fs.mkdirSync(filepath);
			} else {
				fs.readdirSync(filepath).forEach(async (file, index) => {
					fs.unlinkSync(filepath + "/" + file);
					Images.deleteMany({ jwt: req.body.token })
						.then(data => {})
						.catch(err => {
							if (err) {
								logger.error(
									"request for /uploadMultipleFiles and  " +
										req.ip +
										" : generated Error : " +
										err
								);
							}
						});
					await Login.updateOne(
						{ jwt: req.body.token },
						{ $set: { firmImages: [] } },
						function(err, affected) {
							if (err) {
								logger.error(
									"request for /uploadMultipleFiles and  " +
										req.ip +
										" : generated Error : " +
										err
								);

								res.json({ result: "Failure" });
								return;
							}
						}
					);
				});
			}
			for (var i in json) {
				if (json.hasOwnProperty(i)) {
					if (i.includes("image_")) {
						const temp = i.split("/");
						extension.push(temp[1]);
						file.push(json[i]);
					}
				}
			}
			console.log("\n");
			await file.forEach(async (item, index) => {
				filename = object._id + "-" + index + "." + extension[index];
				filx = object._id + "/" + filename;
				fs.writeFile(
					filepath + "/" + filename,
					item,
					"base64",
					function(err) {
						if (err) {
							logger.error(
								"request for /uploadMultipleFiles and  " +
									req.ip +
									" : generated Error on File Create : " +
									err
							);
							res.json({ result: "Failure" });
							return;
						}
					}
				);
				mImage = new Images({
					jwt: req.body.token,
					image: filx
				});
				mImage.save().then(savedData => {
					console.log(savedData._id);
				});
				object.firmImages.push(mImage);
			});
			object.save().then(data => {
				logger.info(
					"request for /uploadMultipleFiles and  " +
						req.ip +
						" has uploaded Images"
				);
				res.json({ result: "Successful" });
				return;
			});
		})
		.catch(err => {
			logger.error(
				"request for /uploadMultipleFiles and  " +
					req.ip +
					" : generated Error : " +
					err
			);
			res.json({ result: "Failure" });
			return;
		});
});

app.post("/api/1.1/themeSelect", headerAuth, async (req, res) => {
	logger.info("\n\n");
	logger.warn("request for /themeSelect with " + req.ip);
	await Login.findOne({ jwt: req.body.token })
		.then(data => {
			data.theme = req.body.theme;
			data.save().then(savedData => {
				logger.info(
					"request for /themeSelect and  " +
						req.ip +
						" has uploaded Images"
				);
				res.json({ result: "Successful" });
				return;
			});
		})
		.catch(err => {
			logger.error(
				"request for /themeSelect and  " +
					req.ip +
					" : generated Error : " +
					err
			);
			res.json({ result: "Failure" });
			return;
		});
});

app.post("/api/1.1/uploadSocial", headerAuth, async (req, res) => {
	logger.info("\n\n");
	logger.warn("request for /uploadSocial with " + req.ip);
	await Login.findOne({ jwt: req.body.token })
		.then(data => {
			if (data != null) {
				(data.ownerFB = req.body.ownerFB),
					(data.ownerInsta = req.body.ownerInsta),
					(data.ownerTweeter = req.body.ownerTweeter),
					(data.ownerPintrest = req.body.ownerPintrest),
					(data.ownerLinkedIn = req.body.ownerLinkedIn);
				data.save().then(savedData => {
					logger.info(
						"request for /uploadSocial and  " +
							req.ip +
							" has uploaded Images"
					);
					res.json({ result: "Successful" });
					return;
				});
			} else {
				logger.warn(
					"request for /uploadSocial with  " +
						req.ip +
						" and got null data.  "
				);
				res.json({ result: "Failure" });
				return;
			}
		})
		.catch(err => {
			logger.error(
				"request for /uploadSocial and  " +
					req.ip +
					" : generated Error : " +
					err
			);
			res.json({ result: "Failure" });
			return;
		});
});

app.get('/generateToken',(req,res)=>{
	jwt.sign(
		{ id: req.query._id },
		process.env.SECRET_KEY,
		{ expiresIn: 31536000 },
		(err, token) => {
			res.send(token);
			return;
		});
		//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVkYTE2YTQ2MGUyOWI4NzNjMDc3MjEwYyIsImlhdCI6MTU3NDQwNDg4MywiZXhwIjoxNjA1OTQwODgzfQ.NBNCHSTPNrZu1mJ2hC6cKLu3KOvB4bZ89EDNA9hPQOE
})

module.exports = app;
