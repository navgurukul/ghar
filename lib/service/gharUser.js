const { pool } = require("../database/db");
const User = require("../models/gharUser");
const jwt = require("jsonwebtoken");
const config = require("../config");
const { google } = require("googleapis");

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
      return false; // Token is not valid
    }
  }
  async teamData(data) {
    try {
      const clientEmail = config.googleSheet.client_email;
      const privateKey = config.googleSheet.private_key.replace(/\\n/g, "\n");

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });

      const authClient = await auth.getClient();
      const sheets = google.sheets({ version: "v4", auth: authClient });

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: "1s1tXnv67PyJ8Hn7_B66XGyLDeNrZuU6CgaXfOB9z8iI",
        range: "Sheet1!A1:N",
      });

      const rows = res.data.values;
      if (rows.length) {
        const headers = rows[0];
        const dataRows = rows.slice(1);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const filteredData = dataRows.slice(data.min, data.max + 1).map((row) => {
          return headers.reduce((acc, header, index) => {
            let value = row[index] !== undefined && row[index] !== "" ? row[index] : null;
            if (value && /^\d{2}-\d{2}-\d{4}$/.test(value)) {
              const [day, month, year] = value.split("-");
              value = `${day}-${monthNames[parseInt(month, 10) - 1]}-${year}`;
            }
            acc[header] = value;
            return acc;
          }, {});
        });

        return filteredData;
      } else {
        console.log("No data found.");
        return [];
      }
    } catch (error) {
      console.error("Error fetching data from Google Sheets:", error);
      return [];
    }
  }
}
module.exports = new GharUsers();
