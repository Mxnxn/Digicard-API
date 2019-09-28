const express = require("express");
const app = express.Router();

app.all("/*",(req,res,next)=>{
    req.app.locals.layout = "payment";
    next();
});

app.get('/',(req,res)=>{
    res.render("payment/plans");
})

module.exports = app;