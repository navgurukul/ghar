const ContestService = require("../service/atcoder");
const config = require("../config");
const Joi = require("joi");
const { min } = require("lodash");

module.exports = [
  {
    method: "GET",
    path: "/atcoder/upcoming-contests",
    options: {
      description: "Get Upcoming Contests",
      tags: ["api"],
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
