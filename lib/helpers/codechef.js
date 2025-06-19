const { GoogleSpreadsheet } = require('google-spreadsheet');    
const { JWT } = require('google-auth-library');
const config = require("../config");

const SPREADSHEET_ID = '1CcPXFRJmkuW8UuBdY-DNgCH16LNygxCftLz94wEcsFc';
// const SHEET_NAME = 'START187'; // Change this dynamically if needed

const serviceAccountAuth = new JWT({
    email: config.googleSheet.client_email,
    key: config.googleSheet.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
async function accessSpreadsheet(sheetName, usernamesToFind) {
  try {
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) {
      return { error: `Sheet "${sheetName}" not found` };
    }

    await sheet.loadCells();

    const rowCount = sheet.rowCount;
    const colCount = Math.min(sheet.columnCount, 5); // Adjust if needed
    const usernameColumnIndex = 0; // Assumes usernames are in column A (0-indexed)

    // Normalize the list for comparison
    const normalizedUsernames = usernamesToFind.map(u => u.trim().toLowerCase());

    const matchedRows = [];
    const foundUsernames = [];

    for (let row = 0; row < rowCount; row++) {
      const usernameCell = sheet.getCell(row, usernameColumnIndex);
      const username = usernameCell.value?.toString().trim().toLowerCase();

      if (username && normalizedUsernames.includes(username)) {
        const rowData = [];
        for (let col = 0; col < colCount; col++) {
          const cell = sheet.getCell(row, col);
          rowData.push(cell.value ?? null);
        }
        matchedRows.push(rowData);
        foundUsernames.push(username);
      }
    }

    // Find usernames that were not found
    const notFoundUsernames = normalizedUsernames.filter(u => !foundUsernames.includes(u));


    // If any rows were matched, return them
if (matchedRows.length > 0) {
      return { data: matchedRows, notFound: notFoundUsernames };
    } else {
      // If no rows were matched, return an error with not found usernames
      return { error: `Not found: ${notFoundUsernames.join(', ')}`, notFound: notFoundUsernames };
    }

  } catch (err) {
   
    return { error: "Failed to access spreadsheet" };
  }
}
module.exports = { accessSpreadsheet };