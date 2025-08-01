const jwt = require("jsonwebtoken");

module.exports = (roles) => {
  return async (req, res, next) => {
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    try {
      const currentUser = jwt.verify(token, process.env.JWT_SECRET_KEY);
      if (!roles.includes(currentUser.role)) {
        return res.status(403).json({ message: "Access Denied", code: 403 });
      }
      req.currentUser = currentUser;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired", error });
      }
      return res.status(401).json({ message: "Invalid token" });
    }
  };
};
