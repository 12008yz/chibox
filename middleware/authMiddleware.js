const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");


const isAuthenticated = async (req, res, next) => {
   // Извлечение токена из заголовка Authorization
   const authHeader = req.header("Authorization");
   if (!authHeader) {
      return res.status(401).json({ message: "No authorization header provided" });
   }

   const tokenParts = authHeader.split(' ');
   if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return res.status(401).json({ message: "Invalid Authorization" });
   }

   const token = tokenParts[1];

   // Проверка токена
   try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.userId, { attributes: { exclude: ["password"] } });
      if (!req.user) {
         return res.status(401).json({ message: "User  not found" });
      }
      next();
   } catch (error) {
      console.log(error.message);
      res.status(401).json({ message: "Token is not valid" });
   }
};

const isAdmin = (req, res, next) => {
   if (req.user && req.user.isAdmin) {
      return next();
   } else {
      return res.status(403).json({ message: "Access denied" });
   }
};

module.exports = {
   isAuthenticated,
   isAdmin,
};