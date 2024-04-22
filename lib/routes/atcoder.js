const ContestService = require("../service/atcoder");
const config = require("../config");
const Joi = require("joi");
const { min } = require("lodash");

module.exports = [
  {
    method: "GET",
    path: "/atcoder/contest-details",
    options: {
      description: "Get Contest Details",
      tags: ["api"],
      validate: {
        query: Joi.object({
          contestId: Joi.string(),
          username: Joi.string(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { contestId, username } = request.query;
        const contestDetails = await ContestService.fetchAtcoderContest(
          contestId,
          username
        );
        // console.log(contestDetails, "contestDetails");
        return h.response(contestDetails);
      } catch (error) {
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },

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
    method: "GET",
    path: "/atcoder/contest-data",
    options: {
      description: "Get Contest Details",
      tags: ["api"],
    },
    handler: async (request, h) => {
      try {
        const contestDetails = await ContestService.getContestData();
        return h.response(contestDetails);
      } catch (error) {
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },
];
