const Boom = require("@hapi/boom");
const Joi = require("joi");
const { accessSpreadsheet } = require("../helpers/codechef");
const verifyService = require("../service/gharUser");

module.exports = [
  {
    method: 'GET',
    path: '/get/CodechefData',
    options: {
      description: 'Get Codechef Data',
      tags: ['api'],
      pre: [
        {
          assign: "auth",
          method: async (request, h) => {
            const tokenHeader =
              request.headers.authorization || request.headers.Authorization;
            if (!tokenHeader) {
              return Boom.unauthorized("No token provided");
            }

            let token = tokenHeader.startsWith("Bearer ")
              ? tokenHeader.split(" ")[1]
              : tokenHeader;

            const isValid = await verifyService.verifyToken({ token: token });

            if (!isValid) {
              return Boom.unauthorized("Invalid token");
            }

            return true;
          },
        },
      ],
      validate: {
        query: Joi.object({
          sheetName: Joi.string().required().description("Name of the Google Sheet to access"),
          usernames: Joi.string().required().description("Username to search in the sheet"),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { sheetName, usernames } = request.query;
            const usernameList = usernames
          .split(',')
          .map(u => u.trim().toLowerCase())
          .filter(Boolean);

        const result = await accessSpreadsheet(sheetName, usernameList);

        // Return both data and notFound if present
        if (result.error) {
          return h.response(result).code(404);
        }
        return h.response(result).code(200);
      } catch (error) {
        return h.response({ error: "Internal server error" }).code(500);
      }
    },
  }
];
