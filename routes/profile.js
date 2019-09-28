const express = require("express");
const app = express.Router();
const Login = require("../models/Login");
const Logo = require("../models/Logo");
const jwt = require("jsonwebtoken");
const Auth = require("../models/Auth");
const Images = require("../models/Images");

app.all("/*", (req, res, next) => {
	req.app.locals.layouts = "profile";
	next();
});

app.get("/", (req, res) => {
	res.render("profile/content-profile");
});

app.get("/:id", async (req, res) => {
	const id = req.params.id;
	await Auth.findOne({ _id: id })
		.then(async authData => {
			// console.log(authData);
			if (authData != null) {
				await jwt.verify(
					authData.jwtToken,
					process.env.SECRET_KEY,
					async (err, decode) => {
						if (err) {
							res.send("Expired");
							return;
						}
						if (decode) {
							await Login.findOne({ jwt: authData.jwtToken })
								.populate("Logo", "Images")
								.then(async xdata => {
									let imagelist = [];
									xdata.firmImages.forEach(
										async (value, index) => {
											await Images.find({
												_id: value
											}).then(data => {
												imagelist.push({
													imagepath: data[0].image
												});
											});
										}
									);
									await Logo.findOne({
										_id: xdata.firmLogo[0]
									})
										.then(async data => {
											filename = "";
											if (data != null) {
												filename = data.logo;
											}
											let address = xdata.contactAddress;
											lol = address.replace("/", " ");
											await res.render(
												"profile/content-profile",
												{
													post: xdata,
													xx: lol,
													userid: authData._id,
													token: jwt,
													filepath: filename,
													images: imagelist
												}
											);
										})
										.catch(err => {
											if (err) {
												console.log(err);
												res.send(
													"Something Gone Wrong"
												);
												return;
											}
										});
								})
								.catch(err => {
									if (err) {
										console.log(err);
										res.send("Something Gone Wrong");
										return;
									}
								});
						}
					}
				);
			} else {
				res.send("NO USER FOUND");
				return;
			}
		})
		.catch(() => {
			res.send("Something Gone Wrong");
			return;
		});
});

app.post("/share", (req, res) => {
	res.redirect(
		`https://wa.me/91${req.body.mNumber}/?text=Here%20is%20my%20Digicard%0Ahttps://digivcard.herokuapp.com/profile/${req.body.cardid}`
	);
});

module.exports = app;
