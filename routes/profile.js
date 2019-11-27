const express = require("express");
const app = express.Router();
const Login = require("../models/Login");
const Logo = require("../models/Logo");
const jwt = require("jsonwebtoken");
const Auth = require("../models/Auth");
const Images = require("../models/Images");
const log4js = require("log4js");
log4js.configure({
	appenders: { profile: { type: "file", filename: "profile.log" } },
	categories: { default: { appenders: ["profile"], level: "info" } }
});

const logger = log4js.getLogger("profile");

app.all("/*", (req, res, next) => {
	req.app.locals.layout = "profile";
	next();
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
							console.log(err);
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
												if (data.length > 0) {
													imagelist.push({
														imagepath: data[0].image
													});
												}
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
											if (xdata.address != null) {
												let address =
													xdata.contactAddress;
												lol = address.replace("/", " ");
											} else {
												lol = "no address inserted";
											}
											logger.info(
												`request for /profile/id; owner : ${xdata.email} `
											);
											console.log(imagelist);
											if (xdata.theme == 1) {
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
											} else if (xdata.theme == 2) {
												await res.render(
													"profile/content-profile1",
													{
														post: xdata,
														xx: lol,
														userid: authData._id,
														token: jwt,
														filepath: filename,
														images: imagelist
													}
												);
											} else {
												await res.render(
													"profile/content-profile3",
													{
														post: xdata,
														xx: lol,
														userid: authData._id,
														token: jwt,
														filepath: filename,
														images: imagelist
													}
												);
											}
										})
										.catch(err => {
											if (err) {
												logger.error(
													`request for /profile/id; owner : ${xdata.email} generated Error for logo collection `
												);
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
										logger.error(
											`request for /profile/id; owner : ${xdata.email} generated Error for logo collection `
										);
										res.send("Something Gone Wrong");
										return;
									}
								});
						}
					}
				);
			} else {
				logger.error(
					`request for /profile/id; ${req.ip} generated Error and Wrong id passed `
				);
				res.send("NO USER FOUND");
				return;
			}
		})
		.catch(() => {
			logger.error(
				`request for /profile/id; ${req.ip} generated error for mAuth`
			);
			res.send("Something Gone Wrong");
			return;
		});
});

app.post("/share", (req, res) => {
	logger.warn(`request for /share; ${req.ip}`);
	res.redirect(
		`https://wa.me/91${req.body.mNumber}/?text=Here%20is%20my%20Digicard%0Ahttps://thedigicard.in/profile/${req.body.cardid}`
	);
});

app.get("/:id/vcf", (req, res) => {
	Login.findOne({ _id: req.params.id })
		.then(data => {
			if (data != null) {
				var vCardsJS = require("vcards-js");
				var vCard = vCardsJS();
				vCard.firstName = data.contactPerson;
				vCard.organization = data.firstName;
				vCard.cellPhone = [data.contactNumber, data.contactNumber2];
				vCard.workEmail = data.contactEmail;
				vCard.workAddress = data.contactAddress;
				vCard.workUrl = data.ownerWeb;
				vCard.socialUrls["facebook"] = data.ownerFB;
				vCard.socialUrls["linkedIn"] = data.ownerLinkedIn;
				vCard.socialUrls["Instagram"] = data.ownerInsta;
				vCard.socialUrls["Tweeter"] = data.ownerTweeter;
				vCard.socialUrls["Pintrest"] = data.ownerPintrest;
				res.set("Content-Type", 'text/vcard; name="contact.vcf"');
				res.set(
					"Content-Disposition",
					'inline; filename="contact.vcf"'
				);
				res.send(vCard.getFormattedString());
				return;
			}
		})
		.catch(err => {
			console.log(err);
			res.json({ result: "OOPS.." });
			return;
		});
});

module.exports = app;
