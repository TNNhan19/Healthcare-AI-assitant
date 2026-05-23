module.exports = function requireRole(roles = []) {
  const allow = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    try {
      const role = req.user && req.user.userType;
      if (!role || !allow.includes(role)) {
        return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
      }
      return next();
    } catch (e) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
  };
}
