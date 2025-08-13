// googleSpreadSheet.js
const { GoogleSpreadsheet } = require('google-spreadsheet');    
const { JWT } = require('google-auth-library');
const config = require("../config");

// Create a JWT auth client
const serviceAccountAuth = new JWT({
    email: config.googleSheet.client_email,
    key: config.googleSheet.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Access the spreadsheet with sheetName 
async function accessSpreadsheet(sheetName, spreadsheetId, usernamesToFind = []) {
  try {

    // Initialize the Google Spreadsheet document
    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
    await doc.loadInfo(); // Load spreadsheet information

    // Get the specific sheet by name
    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) {
      return { error: `Sheet "${sheetName}" not found` };
    }

    // Get the row and column counts of the sheet
    await sheet.loadCells();
    const rowCount = sheet.rowCount;
    const colCount = sheet.columnCount;

    // Normalize the param usernames remove unwanted whitespace
    const normalizedUsernames = (usernamesToFind || []).map(u => u.trim().toLowerCase());
    const matchedRows = [];
    const foundUsernames = new Set();

    // Load the rows and filter based on usernames
    for (let row = 1; row < rowCount; row++) {
      const usernameCell = sheet.getCell(row, 0);
      if (!usernameCell.value) break; // stop on empty username

      // Normalize the cell username
      const username = usernameCell.value?.toString().trim().toLowerCase();
      const isMatch = normalizedUsernames.length === 0 || normalizedUsernames.includes(username);

      // If there's a match, collect the row data
      if (isMatch) {
        const rowData = {};
        for (let col = 0; col < colCount; col++) {
          const keyCell = sheet.getCell(0, col);
          if (!keyCell.value) break;

          // Normalize the key to use as a property name
          const key = keyCell.value?.toString().trim() || `Column${col + 1}`;
          const dataCell = sheet.getCell(row, col);

          // Convert cell date in date format
          const value =
            key.toLowerCase().includes('date') && dataCell.formattedValue
              ? dataCell.formattedValue
              : dataCell.value ?? null;

          // add formatted date in rowData
          rowData[key] = value;
        }

        // Add the row data to matchedRows and track found usernames
        matchedRows.push(rowData);

        // If the username is found, add it to the set
        if (username) foundUsernames.add(username);
      }
    }

    // Identify usernames that were not found
    const notFoundUsernames = normalizedUsernames.length > 0
      ? normalizedUsernames.filter(u => !foundUsernames.has(u))
      : [];

      // Return the final result
    return { data: matchedRows, notFound: notFoundUsernames };
  } catch (err) {
    console.error("Error accessing spreadsheet:", err);
    return { error: "Failed to access spreadsheet" };
  }
}

module.exports = { accessSpreadsheet };



