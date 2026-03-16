const Joi = require("joi");
const { accessSpreadsheet } = require("../service/googleSpreadSheet");
module.exports = [
  {
    method: 'GET',
    path: '/get/SpreadsheetData',
    options: {
      description: 'Get Spreadsheet Data',
      tags: ['api'],
      validate: {
        query: Joi.object({
          sheetName: Joi.string().required().description("Google Sheet tab name"),
          spreadsheetId: Joi.string().required().description("Spreadsheet ID"),
          usernames: Joi.string().optional().description("Comma-separated list of usernames/emails"),
          month: Joi.string().optional().description("Month for filtering data (Aug, August,8 format)")

        }),
      },
    },
    handler: async (request, h) => {
      try {        

        // Extract parameters from the request
        const { sheetName, spreadsheetId, usernames, month } = request.query;

        // convert the usernames to a list and remove unwanted whitespace
        const usernameList = usernames
          ? usernames.split(',').map(u => u.trim().toLowerCase()).filter(Boolean)
          : [];

        // get the spread sheet data
        const result = await accessSpreadsheet(sheetName, spreadsheetId, usernameList, month);

        if (result.error) {
          return h.response(result).code(404);
        }

        // Return the final result
        return h.response(result).code(200);
      } catch (err) {
        console.error("Handler error:", err);
        return h.response({ error: "Internal server error" }).code(500);
      }
    },
  }
];