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
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { sheetName, spreadsheetId, usernames } = request.query;
        const usernameList = usernames
          ? usernames.split(',').map(u => u.trim().toLowerCase()).filter(Boolean)
          : [];
        const result = await accessSpreadsheet(sheetName, spreadsheetId, usernameList);
        if (result.error) {
          return h.response(result).code(404);
        }
        return h.response(result).code(200);
      } catch (err) {
        console.error("Handler error:", err);
        return h.response({ error: "Internal server error" }).code(500);
      }
    },
  }
];