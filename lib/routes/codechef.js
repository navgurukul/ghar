const Boom = require("@hapi/boom");
const Joi = require("joi"); // ✅ Make sure Joi is imported
const { accessSpreadsheet } = require("../helpers/codechef");
const jwt = require("jsonwebtoken");
const config = require("../config");
const verifyService = require("../service/gharUser");

const SECRET_KEY = config.auth.secret_key;

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

            // console.log("Token received:", token);

            const isValid = await verifyService.verifyToken({ token: token });
            // console.log("Token verification result:", isValid);

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
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { sheetName } = request.query;

        if (!sheetName) {
          return h.response({ error: "sheetName query parameter is required" }).code(400);
        }

        const result = await accessSpreadsheet(sheetName);

        if (result.error) {
          return h.response({ error: result.error }).code(500);
        }

        return h.response({ data: result }).code(200);
      } catch (error) {
        console.error('Handler Error:', error);
        return h.response({ error: 'Failed to fetch user data' }).code(500);
      }
    },
  }
]; // ✅ Make sure this closing bracket is in place with semicolon
