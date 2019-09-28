module.exports = function(req,res,next){
    const authToken = req.header('auth-token');
    if(!authToken) res.json({"error":"Access Denied"});

    try{
        if(authToken === process.env.AUTH_TOKEN){
            next();
        }
    }catch(err){
        console.log(err);
        res.json({"error":"Access Denied"});
    }
};