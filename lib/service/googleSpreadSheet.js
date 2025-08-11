// googleSpreadSheet.js
const { GoogleSpreadsheet } = require('google-spreadsheet');    
const { JWT } = require('google-auth-library');
const config = require("../config");

const serviceAccountAuth = new JWT({
    email: config.googleSheet.client_email,
    key: config.googleSheet.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function accessSpreadsheet(sheetName, spreadsheetId, usernamesToFind = []) {
  try {
    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) {
      return { error: `Sheet "${sheetName}" not found` };
    }

    await sheet.loadCells();
    const rowCount = sheet.rowCount;
    const colCount = sheet.columnCount;
    const normalizedUsernames = (usernamesToFind || []).map(u => u.trim().toLowerCase());
    const matchedRows = [];
    const foundUsernames = new Set();

    for (let row = 1; row < rowCount; row++) {
      const usernameCell = sheet.getCell(row, 0);
      if (!usernameCell.value) break; // stop on empty username

      const username = usernameCell.value?.toString().trim().toLowerCase();
      const isMatch = normalizedUsernames.length === 0 || normalizedUsernames.includes(username);

      if (isMatch) {
        const rowData = {};
        for (let col = 0; col < colCount; col++) {
          const keyCell = sheet.getCell(0, col);
          if (!keyCell.value) break;

          const key = keyCell.value?.toString().trim() || `Column${col + 1}`;
          const dataCell = sheet.getCell(row, col);

          // ✅ Use formattedValuec if it exists (especially for Date)
          const value =
            key.toLowerCase().includes('date') && dataCell.formattedValue
              ? dataCell.formattedValue
              : dataCell.value ?? null;

          rowData[key] = value;
        }

        matchedRows.push(rowData);
        if (username) foundUsernames.add(username);
      }
    }

    const notFoundUsernames = normalizedUsernames.length > 0
      ? normalizedUsernames.filter(u => !foundUsernames.has(u))
      : [];

    return { data: matchedRows, notFound: notFoundUsernames };
  } catch (err) {
    console.error("Error accessing spreadsheet:", err);
    return { error: "Failed to access spreadsheet" };
  }
}

module.exports = { accessSpreadsheet };