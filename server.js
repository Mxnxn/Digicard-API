const express = require("express");
const app = express();
const path = require("path");
const exphbs = require("express-handlebars");
const bodyparser = require("body-parser");
const session = require("express-session");
const mongoose = require("mongoose");
require("dotenv").config();
const Helmet = require("helmet");
const http = require("http");
const https = require("https");

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
app.use(Helmet());

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
const contact = require("./routes/contact");

app.use("/", index);
app.use("/contact", contact);
app.use("/profile", profile);

// //! LISTINING
app.listen(3000, () => {
	console.log(`Listening on ${process.env.PORT}`);
});

// const privateKey = fs.readFileSync(
// 	"/etc/letsencrypt/live/www.thedigicard.in/privkey.pem",
// 	"utf8"
// );
// const certificate = fs.readFileSync(
// 	"/etc/letsencrypt/live/www.thedigicard.in/cert.pem",
// 	"utf8"
// );
// const ca = fs.readFileSync(
// 	"/etc/letsencrypt/live/www.thedigicard.in/chain.pem",
// 	"utf8"
// );

// const credentials = {
// 	key: privateKey,
// 	cert: certificate,
// 	ca: ca
// };

// const httpsServer = https.createServer(credentials, app);

// const httpServer = http
// 	.createServer(function(req, res) {
// 		res.writeHead(301, { Location: "https://thedigicard.in/" });
// 	})
// 	.listen(80);

// httpsServer.listen(443, () => {
// 	console.log("HTTPS Server running on port 443");
// });
