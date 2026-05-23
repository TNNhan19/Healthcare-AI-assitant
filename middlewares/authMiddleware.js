const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Sửa: kiểm tra 'Bearer ' (chữ B hoa)
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "No token or invalid format"
      });
    }

    const token = authHeader.split(" ")[1];

    // Sửa: dùng jwt.verify không callback để lấy decoded
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "Token verification failed",
      error: err.message
    });
  }
};