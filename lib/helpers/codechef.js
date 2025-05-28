const { GoogleSpreadsheet } = require('google-spreadsheet');    
const { JWT } = require('google-auth-library');
const config = require("../config");

const SPREADSHEET_ID = '1CcPXFRJmkuW8UuBdY-DNgCH16LNygxCftLz94wEcsFc';
const SHEET_NAME = 'START187'; // Change this dynamically if needed

const serviceAccountAuth = new JWT({
    email: config.googleSheet.client_email,
    key: config.googleSheet.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function accessSpreadsheet(sheetName) {
  try {
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) {
      console.error(`Sheet with name "${sheetName}" not found.`);
      return { error: `Sheet "${sheetName}" not found` };
    }

    await sheet.loadCells(); // Load all cells in the sheet

    const rowCount = sheet.rowCount;
    const colCount = Math.min(sheet.columnCount, 5); // Limit columns to first 5

    const data = [];

    for (let row = 0; row < rowCount; row++) {
      let rowData = [];
      for (let col = 0; col < colCount; col++) {
        const cell = sheet.getCell(row, col);
        rowData.push(cell.value ?? null);
      }

      // Only add non-empty rows
      if (rowData.some(val => val !== null && val !== '')) {
        data.push(rowData);
      }
    }

    return data;

  } catch (err) {
    console.error('Error accessing spreadsheet:', err);
    return { error: 'Failed to access spreadsheet' };
  }
}

module.exports = { accessSpreadsheet };