const Services = require("../service/gharUser");
const Joi = require("joi");
const db = require("../database/db");
const config = require("../config");
const Boom = require('@hapi/boom'); // Make sure to have @hapi/boom installed for custom error handling



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
];
