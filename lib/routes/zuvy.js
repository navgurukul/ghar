const Services = require("../service/zuvy");
const Joi = require("joi");
const verifyService = require("../service/gharUser");
const Boom = require("@hapi/boom");

module.exports = [
  {
    method: "GET",
    path: "/Zuvy/BootCamp/Progress",
    options: {
      description: "Get zoho campus data",
      notes: "Returns a message",
      tags: ["api"],
    //   pre: [
    //     {
    //       assign: "auth",
    //       method: async (request, h) => {
    //         const tokenHeader =
    //           request.headers.authorization || request.headers.Authorization;
    //         if (!tokenHeader) {
    //           return Boom.unauthorized("No token provided");
    //         }
    //         let token;
    //         if (tokenHeader.startsWith("Bearer ")) {
    //           token = tokenHeader.split(" ")[1]; // Extract the token part of the header
    //         } else {
    //           token = tokenHeader; // Assume the entire header is the token
    //         }

    //         // The rest of your existing code for token verification remains the same
    //         const isValid = await verifyService.verifyToken({ token: token }); // Assuming verifyToken is an async function and returns true if valid
    //         if (!isValid) {
    //           // Use Boom to return an unauthorized error
    //           return Boom.unauthorized("Invalid token");
    //         }
    //         return true; // Proceed to the route handler if the token is valid
    //       },
    //     },
    //   ],
      validate: {
        query: Joi.object({
          BootCampId: Joi.number().required(),
          Emails: Joi.string().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { BootCampId, Emails } = request.query;
        // const data = await Services.zohoData();
        let EmailArray = Emails.split(',');
        const response = await Services.ZuvyProgress(BootCampId, EmailArray);
        return h.response(response);
      } catch (err) {
        return h.response({ error: err.message }).code(500);
      }
    },
  },
];
