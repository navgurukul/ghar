const Services = require("../service/zohoApi");
const Joi = require("joi");

module.exports = [
  {
    method: "GET",
    path: "/get/zoho/approvedLeave/count",
    options: {
      description: "Get zoho campus data",
      notes: "Returns a message",
      tags: ["api"],
      validate: {
        query: Joi.object({
          campusID: Joi.string().required(),
          whichDate: Joi.string().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const campusID = request.query.campusID; // Get campusID from the query parameters
        const whichDate = request.query.whichDate; // Get whichDate from the query parameters
        const leaveType = await Services.GetApprovedLeavesPerDay(
          campusID,
          whichDate
        );
        return h.response(leaveType);
      } catch (err) {
        return h.response({ error: err.message }).code(500);
      }
    },
  },

  {
    method: "GET",
    path: "/get/zoho/approvedLeave/{id}",
    options: {
      description: "Get zoho campus data",
      notes: "Returns a message",
      tags: ["api"],
      validate: {
        params: Joi.object({
          id: Joi.string().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        // const data = await Services.zohoData();
        const response = await Services.AddApprovedLeavesToAllotedLeaves(
          request.params.id
        );
        return h.response(response);
      } catch (err) {
        return h.response({ error: err.message }).code(500);
      }
    },
  },

  {
    method: "GET",
    path: "/get/zoho/students",
    options: {
      description: "Get zoho campus data",
      notes: "Returns a message",
      tags: ["api"],
      validate: {
        query: Joi.object({
          min_value: Joi.number().required(),
          max_value: Joi.number().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { min_value, max_value } = request.query;
        // const data = await Services.zohoData();
        const response = await Services.getData(min_value, max_value);
        return h.response(response);
      } catch (err) {
        return h.response({ error: err.message }).code(500);
      }
    },
  },

  {
    method: "POST",
    path: "/zoho/studentDetails",
    options: {
      description: "Get zoho campus data",
      notes: "Returns a message",
      tags: ["api"],
      validate: {
        query: Joi.object({
          range: Joi.string().description("Pune Campus!A2:B18"),
          learningProviderName: Joi.string().description(
            "Moodle, AtCoder, etc."
          ),
          isDev: Joi.bool().required(),
          min_value: Joi.number().required(),
          max_value: Joi.number().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { range, learningProviderName, isDev, min_value, max_value } =
          request.query;
        const response = await Services.updateStudentData(
          range,
          learningProviderName,
          isDev,
          min_value,
          max_value
        );
        return h.response(response);
      } catch (error) {
        return h
          .response("An error occurred while updating student data.")
          .code(500);
      }
    },
  },

  {
    method: "GET",
    path: "/get/sheetData",
    options: {
      description: "Get zoho campus data",
      notes: "Returns a message",
      tags: ["api"],
      validate: {
        query: Joi.object({
          range: Joi.string().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { range } = request.query;
        // Assuming Services.getSheetData returns a promise
        const response = await Services.getSheetData(range);
        return h.response(response);
      } catch (error) {
        console.error(
          "An error occurred while fetching learning platform data:",
          error
        );
        // Instead of returning a generic error message, you can return the actual error message
        return h
          .response({
            error: "An error occurred while fetching learning platform data",
            message: error.message,
          })
          .code(500);
      }
    },
  },
];
