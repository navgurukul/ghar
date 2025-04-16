const mongoose = require("mongoose");
const config = require("../config");
// MongoDB connection URI
const mongoURI = config.mongodbConnection.fccCredential;
// Connect to MongoDB
mongoose
  .connect(mongoURI)
  .then(() => {})
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
  });

// Simplified User schema and model
const userSchema = new mongoose.Schema({
  email: String,
  username: String,
});

const UserModel = mongoose.model("user", userSchema, "user");
module.exports = UserModel;
