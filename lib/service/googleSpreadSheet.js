const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const config = require("../config");

// Create a JWT auth client
const serviceAccountAuth = new JWT({
  email: config.googleSheet.client_email,
  key: config.googleSheet.private_key.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

/**
 * Normalize month input
 * Supports "8", "08", "Aug", "August" → returns 0–11
 */
function normalizeMonth(month) {
  if (!month) return null;

  const shortMonths = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

  // Case 1: numeric input ("8" → 7)
  if (!isNaN(month)) {
    let m = parseInt(month, 10) - 1;
    return (m >= 0 && m < 12) ? m : null;
  }

  // Case 2: string input ("Aug", "August")
  const lower = month.toString().trim().toLowerCase();
  for (let i = 0; i < 12; i++) {
    if (shortMonths[i] === lower || shortMonths[i] === lower.substring(0,3)) {
      return i;
    }
  }
  return null;
}

/**
 Access spreadsheet and filter data
 */
async function accessSpreadsheet(sheetName, spreadsheetId, usernamesToFind = [], month = "") {
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
    const normalizedMonth = normalizeMonth(month);
   
    // Buckets
    const data = [];
    const defective = [];
    const foundUsernames = new Set();
    const notFound = []; // Users requested but not found in sheet

    // Iterate over rows
    for (let row = 1; row < rowCount; row++) {
      const usernameCell = sheet.getCell(row, 0);
      if (!usernameCell.value) break; // Stop at first empty row

      const username = usernameCell.value.toString().trim().toLowerCase();
      const isMatchUser = normalizedUsernames.length === 0 || normalizedUsernames.includes(username);

      if (!isMatchUser) {
        notFound.push({ username, reason: "User not found in ghar" });
        
        continue;
      }

      let rowData = {};
      let hasMissing = false;
      let matchesMonth = (normalizedMonth === null); // if no filter, accept all

      // Collect row data
      for (let col = 0; col < colCount; col++) {
        const keyCell = sheet.getCell(0, col);
        if (!keyCell.value) break;

        const key = keyCell.value?.toString().trim() || `Column${col + 1}`;
        const dataCell = sheet.getCell(row, col);
        const value = dataCell.formattedValue || dataCell.value || null;

        rowData[key] = value;

        // Track missing fields
        if (value === null || value === "") {
          hasMissing = true;
        }

        // Check month filter only for "Completion Date"
        if (normalizedMonth !== null && key.toLowerCase().includes("completion date") && value) {
          let cellMonth = null;
          if (dataCell.value instanceof Date) {
            cellMonth = dataCell.value.getMonth();
          } else {
            const parsed = new Date(value);
            if (!isNaN(parsed)) {
              cellMonth = parsed.getMonth();
            }
          }
          matchesMonth = (cellMonth === normalizedMonth);
        }
      }

      // Skip if month filter fails
      if (!matchesMonth) continue;
      
      // Decide bucket
      if (!foundUsernames.has(username) && !hasMissing) {
        // Add to data if not already found and no missing fields
        data.push(rowData);
        // Track found usernames to avoid duplicates
        foundUsernames.add(username);
      } else {
        rowData.reason = hasMissing ? "missing" : "duplicate";
        defective.push(rowData);
        foundUsernames.add(username);
           
      }
    }

    // Add usernames requested but completely absent from sheet
    if (normalizedUsernames.length > 0) {
      const missing = normalizedUsernames.filter(u => !foundUsernames.has(u));
      missing.forEach(u => {
        notFound.push({ username: u, reason: "not found in Sheet" });
      });
    }

    // Return the final result
    return { data, defective, notFound };

  } catch (err) {
    console.error("Error accessing spreadsheet:", err);
    return { error: "Failed to access spreadsheet" };
  }
}

module.exports = { accessSpreadsheet };



