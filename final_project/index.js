const express = require('express');
const jwt = require('jsonwebtoken');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

require('dotenv').config();

const app = express();

app.use(express.json()); 

app.use("/customer/auth/*", (req, res, next) => {
  const token = req.headers['authorization']; 

  if (!token) {
    return res.status(401).json({ message: "Access token is missing" });
  }

  const tokenWithoutBearer = token.startsWith("Bearer ") ? token.slice(7) : token;

  jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
});

const PORT = process.env.PORT || 5000;

app.use("/customer", customer_routes);  
app.use("/", genl_routes);  

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
