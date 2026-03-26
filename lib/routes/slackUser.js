const { getUserNames } = require('../service/slackUser');
const verifyService = require("../service/gharUser")
const Boom = require("@hapi/boom");


module.exports = [
  {
    method: 'GET',
    path: '/get/slack/users',
    options: {
      description: 'Get Slack Users',
      tags: ['api'],
      pre: [
        {
          assign: "auth",
          method: async (request, h) => {
            const tokenHeader =
              request.headers.authorization || request.headers.Authorization;
            console.log(tokenHeader, "tokenHeader");
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
            console.log(token, "Extracted Token");

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
        const users = await getUserNames();
        if (users.error) {
          return h.response({ error: users.error }).code(500);
        }
        return { users };
      } catch (error) {
    
        return h.response({ error: 'Failed to fetch user data' }).code(500);
      }
    },
  },
];
