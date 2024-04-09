const { google } = require("googleapis");
const sheets = google.sheets("v4");
const config = require("../config");

async function authenticateWithServiceAccount(range) {
  try {
    // Configure a JWT auth client
    const authClient = new google.auth.JWT(
      config.googleSheet.client_email,
      null,
      config.googleSheet.private_key,
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    // Authenticate the JWT client
    await authClient.authorize();

    // Use the authenticated client to access the Sheets API
    const response = await sheets.spreadsheets.values.get({
      auth: authClient,
      spreadsheetId: "1mToJ-mTN6WWMSpxst4jX1o2pMVh5bai5qSOCrcYOGa4",
      range: range, // Specify the range you want to access ("Pune Campus!A2:B18")
    });
    // Convert the array of values into an object with key-value pairs
    const values = response.data.values;
    const valuesObject = {};

    if (values.length > 0) {
      for (const row of values) {
        // Assuming the first column is the key and the rest are values
        const key = row[0];
        const valuesWithoutKey = row.slice(1); // Get values excluding the key
        valuesObject[key] = valuesWithoutKey;
      }
    }

    return valuesObject;

    // return response.data.values;
  } catch (error) {
    console.error("Error authenticating with service account:", error);
    throw error; // Re-throw the error to propagate it to the caller
  }
}

module.exports = { authenticateWithServiceAccount };
