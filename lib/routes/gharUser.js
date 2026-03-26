const Services = require("../service/gharUser");
const Joi = require("joi");
const db = require("../database/db");
const config = require("../config");
const Boom = require('@hapi/boom'); // Make sure to have @hapi/boom installed for custom error handling
const { max } = require("lodash");



module.exports = [
  {
    method: "POST",
    path: "/authenticate/gharUsers",
    options: {
      description: "ghar users",
      tags: ["api"],
      validate: {
        query: Joi.object({
          accessKey: Joi.string().custom((value, helpers) => {
            if (value === config.auth.access_key) {
              return value; // Validation success
            } else {
              // Instead of returning a custom error here, let the validation fail
              return helpers.error('any.invalid');
            }
          }).required(),
        }),
        payload: Joi.object({
          email: Joi.string().required(),
        }),
        failAction: (request, h, err) => {
          // Check if the error is because of the accessKey validation
          if (err.details[0].path.includes('accessKey')) {
            // Throw a custom error using Boom for better error handling
            throw Boom.notAcceptable('Invalid access key');
          }
          // For other validation errors, throw the original error
          throw err.message;
        }
      },
    },
    handler: async (request, h) => {
      try {
        const data = await Services.gharUser(request.payload);
        return h.response(data);
      } catch (err) {
        console.error(err);
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },

  {
    method: "POST",
    path: "/authenticate/verifyToken",
    options: {
      description: "ghar users",
      tags: ["api"],
      validate: {
        // Define any required query parameters here, if necessary
        payload: Joi.object({
          token: Joi.string().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const data = await Services.verifyToken(request.payload);
        return h.response(data);
      } catch (err) {
        console.error(err);
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },

  // Team data geting from google sheet
  {
    method: "POST",
    path: "/teamData",
    options: {
      description: "ghar users",
      tags: ["api"],
      pre: [
        {
          assign: "auth",
          method: async (request, h) => {
            const tokenHeader =
              request.headers.authorization || request.headers.Authorization;
            if (!tokenHeader) {
              return Boom.unauthorized("No token provided");
            }
            let token;
            if (tokenHeader.startsWith("Bearer ")) {
              token = tokenHeader.split(" ")[1]; // Extract the token part of the header
            } else {
              token = tokenHeader; // Assume the entire header is the token
            }

            // The rest of your existing code for token verification remains the same
            const isValid = await Services.verifyToken({ token: token }); // Assuming verifyToken is an async function and returns true if valid
            if (!isValid) {
              // Use Boom to return an unauthorized error
              return Boom.unauthorized("Invalid token");
            }
            return true; // Proceed to the route handler if the token is valid
          },
        },
      ],
      validate: {
        // Define any required query parameters here, if necessary
        payload: Joi.object({
          min: Joi.number().required(),
          max: Joi.number().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const data = await Services.teamData(request.payload);
        return h.response(data);
      } catch (err) {
        console.error(err);
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },
];
