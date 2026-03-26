const Services = require("../service/freeCodeCamp");
const verifyService = require("../service/gharUser")
const Joi = require("joi");
const Boom = require('@hapi/boom'); // Make sure to have @hapi/boom installed for custom error handling

module.exports = [
  {
    method: 'POST',
    path: '/freeCodeCamp/FCC_USERNAME',
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
        const data = await Services.fetchUserName(userNameArray); 
        return h.response(data);  // Using h.response to ensure proper response handling
      } catch (err) {
        console.error(err);
        return h.response({ error: 'Internal Server Error' }).code(500);
      }
    },
  },

   {
        method: 'POST',
        path: '/freeCodeCamp/FCC_Completed_Challenges',
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
            const data = await Services.FCC_Completed_Challenges(userNameArray); 
            return h.response(data);  // Using h.response to ensure proper response handling
          } catch (err) {
            console.error(err);
            return h.response({ error: 'Internal Server Error' }).code(500);
          }
        },
      },

      {
        method: 'POST',
        path: '/freeCodeCamp/FCC_Completed_Challenges_Filtered',
        options: {
          description: 'Filtered challenges in FCC', 
          notes: 'Filtered challenges in FCC',
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
              page: Joi.number().integer().min(1).default(1),
              pageSize: Joi.number().integer().min(1).default(20),
            }),
          },
        },
        handler: async (request, h) => {
          try {
            const { userName, page, pageSize } = request.payload;
            const userNameArray = userName.split(',');
            const pagination = { page, pageSize };
            const data = await Services.FCC_Completed_Challenges_Filtered(userNameArray, pagination); 
            return h.response(data);  // Using h.response to ensure proper response handling
          } catch (err) {
            console.error(err);
            return h.response({ error: 'Internal Server Error' }).code(500);
          }
        },
      }
  
];
