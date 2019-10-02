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
const fsex = require("fs-extra");

const {
	registerValidation,
	loginValidation
} = require("../helpers/validation");
const headerAuth = require("../helpers/headerAuth");

app.get("/", (req, res) => {
	res.render("index/content");
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
app.post("/register", headerAuth, async (req, res) => {
	// console.log(req.body);
	const { error } = registerValidation(req.body);
	if (error) {
		console.log(error);
		res.json({ error: error.details[0].message });
		return;
	}

	//! REGISTERATION INFORMATION TO MONGODB
	const mObj = Register({
		name: req.body.name,
		email: req.body.email,
		pass: req.body.password,
		phone: req.body.phonenumber,
		paid: req.body.paid,
		years: req.body.years,
		paymentID: req.body.paymentID,
		paymentDetailID: req.body.paymentDetailID
	});

	if (req.body.years == "1") {
		time = 3153600;
	} else if (req.body.years == "2") {
		time = 63072000;
	} else if (req.body.years == "3") {
		time = 9460800;
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
						console.log(err);
						res.json({ error: "Failure" });
						return;
					}
					//! STORING email,pass,jwttoken TO MONGODB FOR LOGIN
					const mLogin = Login({
						jwt: token,
						email: data.email,
						pass: data.pass
					});
					mLogin.save().then(data => {
						//! IF EVERYTHING REMAINS SUCESSFUL
						const mAuth = Auth({
							jwtToken: token
						});
						mAuth.save().then(data => {
							res.json({ error: "Successful" });
							return;
						});
					});
				}
			);
		})
		.catch(err => {
			console.log(err);
			res.json({ error: "Failure" });
			return;
		});
});

app.post("/ExistingUser", (req, res) => {
	Register.findOne({ email: req.body.email })
		.then(data => {
			if (data != null) {
				res.json({ result: "Existed" });
				return;
			} else {
				res.json({ result: "New" });
				return;
			}
		})
		.catch(err => {
			res.json({ result: "Failure" });
			return;
		});
});

app.post("/updatePaymentDetails", headerAuth, (req, res) => {
	console.log(req.body);
	Register.findOne({ email: req.body.email })
		.then(Data => {
			if (Data != null) {
				Data.paid = "true";
				Data.save().then(data => {
					res.json({ result: "Successful" });
					return;
				});
			} else {
				res.json({ result: "Failure" });
				return;
			}
		})
		.catch(err => {
			console.log(err);
			res.json({ result: "Failure" });
			return;
		});
});

//! FOR LOGIN
app.post("/user", headerAuth, (req, res) => {
	res.setHeader("Content-Type", "application/json");
	const { error } = loginValidation(req.body);
	if (error) {
		console.log(error.details[0].message);
		res.json({ result: error.details[0].message });
		return;
	}
	Register.findOne({ email: req.body.usrEmail })
		.then(data => {
			if (data != null) {
				if (data.paid == "false") {
					res.json({ result: "NotPaid" });
					return;
				}
				if (data.paid == "true") {
					Login.findOne({ email: req.body.usrEmail })
						.then(data => {
							if (data != null) {
								if (data.pass == req.body.usrPassword) {
									Auth.findOne({ jwtToken: data.jwt })
										.then(authData => {
											if (authData != null) {
												res.json({
													result: "Successful",
													token: data.jwt,
													userid: authData._id
												});
												return;
											} else {
												res.json({ result: "Failure" });
												return;
											}
										})
										.catch(error => {
											if (error) throw error;
										});
									// res.json({ result: "Successful", token: data.jwt });
									// return;
								} else {
									res.json({ result: "Invalid Credential" });
									return;
								}
							} else {
								res.json({ result: "Failure" });
								return;
							}
						})
						.catch(err => {
							res.json({ result: "Failure" });
							return;
						});
				}
			}
		})
		.catch(err => {
			res.json({ result: "Failure" });
			return;
		});
});

app.post("/upload", headerAuth, (req, res) => {
	console.log(req.body);
	Login.findOne({ jwt: req.body.userToken })
		.then(data => {
			(data.firmName = req.body.firmName),
				(data.firmDetail = req.body.firmDetail),
				(data.contactPerson = req.body.contactPerson),
				(data.contactNumber = req.body.contactNumber),
				(data.contactNumber2 = req.body.contactNumber2),
				(data.contactEmail = req.body.contactEmail),
				(data.contactAddress = req.body.contactAddress);
			data.save().then(updatedData => {
				res.json({
					result: "Successful",
					"user-token": updatedData.jwt
				});
				return;
			});
		})
		.catch(err => {
			res.json({ result: "Failure" });
			return;
		});
});

app.post("/getData", headerAuth, (req, res) => {
	console.log(req.body.userToken);
	Login.findOne({ jwt: req.body.userToken })
		.then(data => {
			if (data != null) {
				res.json({
					firmName: data.firmName,
					firmDetail: data.firmDetail,
					contactPerson: data.contactPerson,
					contactEmail: data.contactEmail,
					contactAddress: data.contactAddress,
					contactNumber: data.contactNumber,
					contactNumber2: data.contactNumber2
				});
				return;
			} else {
				res.json({ result: "Failure" });
				return;
			}
		})
		.catch(err => {
			res.json({ result: "Failure" });
			return;
		});
});

//! for LOGO
app.post("/uploadlogo", headerAuth, (req, res) => {
	try {
		Login.findOne({ jwt: req.body.token })
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
						if (err) console.log(err);
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
							res.json({ result: "Successful" });
							return;
						});
					})
					.catch(err => {
						res.json({ result: "Failure" });
						return;
					});
			})
			.catch(err => {
				console.log(err);
				res.json({ result: "Failure" });
				return;
			});
	} catch (err) {
		console.log(err);
		res.json({ result: "Failure" });
		return;
	}
});

//! FOR MULTIPLE FILE UPLOAD
app.post("/uploadMultipleFiles", headerAuth, async (req, res) => {
	// console.log(req.body);
	const json = req.body;
	let extension = [],
		file = [];
	Login.findOne({ jwt: req.body.token })
		.then(object => {
			filepath = "public/uploadImages/" + object._id;
			if (!fs.existsSync(filepath)) {
				fs.mkdirSync(filepath);
			} else {
				fs.readdirSync(filepath).forEach((file, index) => {
					fs.unlinkSync(filepath + "/" + file);
					Images.deleteMany({ jwt: req.body.token })
						.then(data => {})
						.catch(err => {
							if (err) {
								console.log(err);
							}
						});
					Login.updateOne(
						{ jwt: req.body.token },
						{ $set: { firmImages: [] } },
						function(err, affected) {
							if (err) {
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
			file.forEach((item, index) => {
				filename = object._id + "-" + index + "." + extension[index];
				filx = object._id + "/" + filename;
				fs.writeFile(
					filepath + "/" + filename,
					item,
					"base64",
					function(err) {
						if (err) {
							console.log(err);
							res.json({ result: "Failure" });
							return;
						}
					}
				);
				mImage = Images({
					jwt: req.body.token,
					image: filx
				});
				mImage.save().then(savedData => {});
				object.firmImages.push(mImage);
			});
			object.save().then(data => {
				res.json({ result: "Successful" });
				return;
			});
		})
		.catch(err => {
			console.log(err);
			res.json({ result: "Failure" });
			return;
		});
});

app.post("/uploadSocial", (req, res) => {
	Login.findOne({ jwt: req.body.token })
		.then(data => {
			if (data != null) {
				(data.ownerFB = req.body.ownerFB),
					(data.ownerInsta = req.body.ownerInsta),
					(data.ownerTweeter = req.body.ownerTweeter),
					(data.ownerPintrest = req.body.ownerPintrest),
					(data.ownerLinkedIn = req.body.ownerLinkedIn);
				data.save().then(savedData => {
					res.json({ result: "Successful" });
					return;
				});
			} else {
				res.json({ result: "Failure" });
				return;
			}
		})
		.catch(err => {
			res.json({ result: "Failure" });
			return;
		});
});

module.exports = app;
