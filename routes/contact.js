const express = require("express");
const app = express.Router();

app.all("/*", (req, res, next) => {
	req.app.locals.layouts = "contact";
	next();
});

app.get("/", (req, res) => {
	res.render("contact/content");
});

module.exports = app;
