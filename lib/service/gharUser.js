const { pool } = require("../database/db");
const User = require("../models/gharUser");
const jwt = require("jsonwebtoken");
const config = require("../config");

class GharUsers {
  async gharUser(data) {
    try {
      const user = await User.findOne({ where: { email: data.email } });
      if (user == null) {
        const newUser = await User.create({
          email: data.email,
        });
        if (newUser.dataValues) {
          const userToken = jwt.sign(
            { id: newUser.dataValues.id, email: newUser.dataValues.email },
            config.auth.secret_key, // Replace 'yourSecretKey' with your actual secret key
            { expiresIn: "90d" } // Token expires in 90 days
          );
          return { token: userToken };
        }
      } else {
        // Create a JWT token
        const userToken = jwt.sign(
          { id: user.id, email: user.email },
          config.auth.secret_key, // Replace 'yourSecretKey' with your actual secret key
          { expiresIn: "90d" } // Token expires in 90 day
        );
        return { token: userToken };
      }
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token.token, config.auth.secret_key);
      return true; // Token is valid
    } catch (error) {
      console.error("Invalid token:", error);
      return false; // Token is not valid
    }
  }
}
module.exports = new GharUsers();
