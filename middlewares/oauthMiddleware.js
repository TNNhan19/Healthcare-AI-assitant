const jwt= require("jsonwebtoken");
const axios= require("axios");
module.exports= async (req,res,next)=>{
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No token or invalid format"
            });
        }
        const token = authHeader.split(" ")[1];
        const provider= req.headers['x-oauth-provider'];
        let userInfo;
        if (provider === 'google') {
            // Xác thực token với Google
            const response = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`);
            userInfo ={
                id: response.data.sub,
                email: response.data.email,
                name: response.data.name
                picture: response.data.picture
            };
        } else if (provider === 'facebook') {
            const response = await axios.get(`https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,picture`);
            userInfo = {
                id: response.data.id,
                email: response.data.email|| null,
                name: response.data.name,
                picture: response.data.picture.data.url||null
            };
        } else{
            return res.status(400).json({
                success: false,
                message: "Unsupported OAuth provider"
            });
        }
        req.user = userInfo;
        next();
    } catch (err) {
        res.status(401).json({
            success: false,
            message: "Oauth2 verification failed",
            error: err.message
        });
    }
}
