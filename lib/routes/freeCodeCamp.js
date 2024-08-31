const Services = require("../service/freeCodeCamp");
const verifyService = require("../service/gharUser")
const Joi = require("joi");
const db = require("../database/db");
const config = require("../config");
const Boom = require('@hapi/boom'); // Make sure to have @hapi/boom installed for custom error handling



module.exports = [
    {
        method: 'POST',
        path: '/freeCodeCamp/courses',
        options: {
          description: 'courses in FCC', 
          notes: 'courses in FCC',
          tags: ['api'],
          pre: [
            {
              assign: "auth",
              method: async (request, h) => {
                const tokenHeader =
                  request.headers.authorization || request.headers.Authorization;
                if (!tokenHeader) {
                  console.log("No Authorization header present");
                  return Boom.unauthorized("No token provided");
                }
                let token;
                if (tokenHeader.startsWith("Bearer ")) {
                  token = tokenHeader.split(" ")[1]; // Extract the token part of the header
                } else {
                  token = tokenHeader; // Assume the entire header is the token
                }
                // The rest of your existing code for token verification remains the same
                const isValid = await verifyService.verifyToken({token:token}); // Assuming verifyToken is an async function and returns true if valid
                if (!isValid) {
                  // Use Boom to return an unauthorized error
                  return Boom.unauthorized("Invalid token");
                }
                return true; // Proceed to the route handler if the token is valid
              },
            },
          ],
        },
        handler: async (request, h) => {
          try {
            // const { checkProdOrDev } = request.query;
            const data = await Services.fccCoursesInsertInDatabase(); 
            return h.response(data);  // Using h.response to ensure proper response handling
          } catch (err) {
            console.error(err);
            return h.response({ error: 'Internal Server Error' }).code(500);
          }
        },
      },

      {
        method: 'POST',
        path: '/freeCodeCamp/user_completed_challeges',
        options: {
          description: 'challenges in FCC', 
          notes: 'challenges in FCC',
          tags: ['api'],
          pre: [
            {
              assign: "auth",
              method: async (request, h) => {
                const tokenHeader =
                  request.headers.authorization || request.headers.Authorization;
                if (!tokenHeader) {
                  console.log("No Authorization header present");
                  return Boom.unauthorized("No token provided");
                }
                let token;
                if (tokenHeader.startsWith("Bearer ")) {
                  token = tokenHeader.split(" ")[1]; // Extract the token part of the header
                } else {
                  token = tokenHeader; // Assume the entire header is the token
                }
                // The rest of your existing code for token verification remains the same
                const isValid = await verifyService.verifyToken({token:token}); // Assuming verifyToken is an async function and returns true if valid
                if (!isValid) {
                  // Use Boom to return an unauthorized error
                  return Boom.unauthorized("Invalid token");
                }
                return true; // Proceed to the route handler if the token is valid
              },
            },
          ],
          validate: {
            payload: Joi.object({
              userName: Joi.string().required(),
            }),
          },
        },
        handler: async (request, h) => {
          try {
            const { userName } = request.payload;
            const userNameArray = request.payload.userName.split(',');
            const data = await Services.fccChallengesCompletedByUsers(userNameArray); 
            return h.response(data);  // Using h.response to ensure proper response handling
          } catch (err) {
            console.error(err);
            return h.response({ error: 'Internal Server Error' }).code(500);
          }
        },
      },

      {
        method: 'POST',
        path: '/freeCodeCamp/number_of_challenges_completed_courseWise',
        options: {
          description: 'challenges in FCC', 
          notes: 'challenges in FCC',
          tags: ['api'],
          pre: [
            {
              assign: "auth",
              method: async (request, h) => {
                const tokenHeader =
                  request.headers.authorization || request.headers.Authorization;
                if (!tokenHeader) {
                  console.log("No Authorization header present");
                  return Boom.unauthorized("No token provided");
                }
                let token;
                if (tokenHeader.startsWith("Bearer ")) {
                  token = tokenHeader.split(" ")[1]; // Extract the token part of the header
                } else {
                  token = tokenHeader; // Assume the entire header is the token
                }
                // The rest of your existing code for token verification remains the same
                const isValid = await verifyService.verifyToken({token:token}); // Assuming verifyToken is an async function and returns true if valid
                if (!isValid) {
                  // Use Boom to return an unauthorized error
                  return Boom.unauthorized("Invalid token");
                }
                return true; // Proceed to the route handler if the token is valid
              },
            },
          ],
          validate: {
            payload: Joi.object({
              userName: Joi.string().required(),
            }),
          },
        },
        handler: async (request, h) => {
          try {
            const { userName } = request.payload;
            const userNameArray = request.payload.userName.split(',');
            const data = await Services.numberOfChallengesCompleted(userNameArray); 
            return h.response(data);  // Using h.response to ensure proper response handling
          } catch (err) {
            console.error(err);
            return h.response({ error: 'Internal Server Error' }).code(500);
          }
        },
      },
];
