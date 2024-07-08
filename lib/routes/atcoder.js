const ContestService = require("../service/atcoder");
const config = require("../config");
const Joi = require("joi");
const verifyService = require("../service/gharUser")
const Boom = require("@hapi/boom");
const { min } = require("lodash");

module.exports = [
  {
    method: "GET",
    path: "/atcoder/upcoming-contests",
    options: {
      description: "Get Upcoming Contests",
      tags: ["api"],
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
    handler: async (req, h) => {
      try {
        // Call the scrapeContestData function to get upcoming contests data
        const upcomingContests = await ContestService.upcomingContestsIds();

        // Return the upcoming contests data as the response
        return h.response(upcomingContests);
      } catch (error) {
        console.error("Error:", error);
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },
  {
    method: "POST",
    path: "/atcoder/contest-details/post",
    options: {
      description: "Post Contest Details",
      tags: ["api"],
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
      validate: {
        payload: Joi.object({
          contestId: Joi.string(),
          username: Joi.string(),
          delay: Joi.number().default(500),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const userNameArray = request.payload.username.split(",");
        const { contestId, delay } = request.payload;
        const contestDetails = await ContestService.fetchAtcoderContest(
          contestId,
          userNameArray,
          delay
        );
        return h.response(contestDetails);
      } catch (error) {
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },
];
