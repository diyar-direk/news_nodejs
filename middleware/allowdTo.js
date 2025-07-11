const jwt = require("jsonwebtoken");

module.exports = (roles) => {
  return async (req, res, next) => {
    const authHeader =
      req.headers["Authorization"] || req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ message: "UnAuthrithed" });
    const token = authHeader.split(" ")[1];
    const currentUser = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!roles.includes(currentUser.role))
      return res.status(403).json({ meassage: "access dined", code: 403 });
    req.currentUser = currentUser;
    next();
    try {
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: error.meassage });
    }
  };
};
