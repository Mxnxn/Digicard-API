const express = require("express");
const app = express();
const path = require("path");
const exphbs = require("express-handlebars");
const bodyparser = require("body-parser");
const session = require("express-session");
const mongoose = require("mongoose");
require("dotenv").config();

// CONNECTING MONGO DB
mongoose
	.connect(process.env.DB_CONNECTION, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(db => {
		console.log("Connected");
	})
	.catch(error => console.log("Lost Connection : " + error));

app.use(
	session({
		secret: process.env.SESSION_ID,
		saveUninitialized: true,
		resave: true
	})
);

//! VIEW ENGINE AS HANDLEBARS
app.engine("handlebars", exphbs({ defaultLayout: "profile" }));
app.set("view engine", "handlebars");

//! BODY PARSER
app.use(
	bodyparser.urlencoded({
		limit: "50mb",
		extended: true
	})
);
app.use(bodyparser.json({ limit: "50mb" }));

//! DIRECTORY
app.use(express.static(path.join(__dirname, "public")));

//! MIDDLEWARES
const profile = require("./routes/profile");
const index = require("./routes/index");
const payment = require("./routes/payment");

app.use("/", index);
app.use("/profile", profile);
app.use("/payment", payment);

//! LISTINING
app.listen(process.env.PORT || 3000, () => {
	console.log(`Listening on ${process.env.PORT}`);
});
