const { google } = require("googleapis");
const sheets = google.sheets("v4");
const config = require("../config");

async function authenticateWithServiceAccount(range) {
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
  return response.data.values;

  // Log the response from the Sheets API
}

module.exports = { authenticateWithServiceAccount };