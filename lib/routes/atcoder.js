const ContestService = require("../service/atcoder");
// const zohoServices = require("../service/zohoApi");
const config = require("../config");
const Joi = require("joi");
const { min } = require("lodash");

module.exports = [
  {
    method: "GET",
    path: "/get/atcoder-data",
    options: {
      description: "Get AtCoder Data",
      tags: ["api"],
      validate: {
        query: Joi.object({
          contestType: Joi.string(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        // Extract contestType from request query parameters
        const { contestType } = request.query;

        // Validate that contestType is provided
        if (!contestType) {
          return h.response({ error: "Contest type not provided" }).code(400);
        }

        // Fetch the latest contest based on the provided contestType
        const latestContest = await ContestService.getLatestContestName(
          contestType
        );

        // Return an error if no contest is found for the provided type
        if (!latestContest) {
          return h
            .response({ error: `No ${contestType} contests found` })
            .code(404);
        }

        // Construct the standings URL for the latest contest
        const standingsUrl = `https://atcoder.jp/contests/${latestContest.id}/standings/json`;

        // Log in to AtCoder and obtain a session
        const session = await ContestService.loginAndGetSession(
          config.Atcoder.login_user,
          config.Atcoder.login_psw
        );

        // Fetch JSON data for the standings
        const jsonData = await ContestService.getJSONData(
          standingsUrl,
          session
        );

        // Validate the structure of the fetched data
        if (
          !jsonData ||
          !jsonData.StandingsData ||
          !Array.isArray(jsonData.StandingsData)
        ) {
          throw new Error(
            "Invalid data structure. Unable to extract required fields."
          );
        }

        const UserData = {};
        jsonData.StandingsData.forEach((user) => {
          UserData[user.UserName] = {
            LastContest: latestContest.id,
            UserScreenName: user.UserScreenName,
            Rank: user.Rank,
            TotalAccepted: user.TotalResult ? user.TotalResult.Accepted : null,
            TotalScore: user.TotalResult ? user.TotalResult.Score : null,
            Rating: user.Rating,
            IsRated: user.IsRated,
          };
        });

        // Return the users data as the response
        return h.response(UserData);
      } catch (error) {
        // Handle errors and return an Internal Server Error response
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },
  {
    method: "GET",
    path: "/get/atcoder-rating",
    options: {
      description: "Get AtCoder Rating for a User",
      tags: ["api"],
      validate: {
        query: Joi.object({
          username: Joi.string(),
          contestName: Joi.string(),
        }),
      },
    },

    handler: async (request, h) => {
      try {
        // Extract username, password, and contestName from request query parameters
        const { username, contestName } = request.query;

        // Fetch the latest contest based on the provided contestName
        const contest = await ContestService.getLatestContestName(contestName);

        // Return an error if no contest is found for the provided contestName
        if (!contest) {
          return h.response({ error: "No contests found" }).code(404);
        }

        // Construct the standings URL for the latest contest
        const standingsUrl = `https://atcoder.jp/contests/${contest.id}/standings/json`;

        // Return an error if standingsUrl is not available
        if (!standingsUrl) {
          return h.response({ error: "Not participated" }).code(404);
        }

        // Log in to AtCoder with the provided username and password
        const session = await ContestService.loginAndGetSession(
          config.Atcoder.login_user,
          config.Atcoder.login_psw
        );
        // Fetch JSON data for the standings
        const jsonData = await ContestService.getJSONData(
          standingsUrl,
          session
        );

        // Validate the structure of the fetched data
        if (
          !jsonData ||
          !jsonData.StandingsData ||
          !Array.isArray(jsonData.StandingsData)
        ) {
          throw new Error(
            "Invalid data structure. Unable to extract required fields."
          );
        }

        // Retrieve the user's rating from the fetched data
        const userRating = await ContestService.getUserRating(
          username,
          jsonData
        );

        // Return the username and userRating as the response
        return h.response({ username, userRating });
      } catch (error) {
        // Handle errors and return an Internal Server Error response
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },
  {
    method: "GET",
    path: "/get/atcoder-user-participated-contests",
    options: {
      description: "Get AtCoder User Submissions",
      tags: ["api"],
      validate: {
        query: Joi.object({
          username: Joi.string(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { username } = request.query;

        // Fetch user submissions
        const contestIds = await ContestService.userParticipatedContests(
          username
        );

        return h.response(contestIds);
      } catch (error) {
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },

  {
    method: "GET",
    path: "/get/previous-contests-by-type",
    options: {
      description: "Get Previous Contests by Type",
      tags: ["api"],
      validate: {
        query: Joi.object({
          contestType: Joi.string(),
          count: Joi.number(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { contestType, count } = request.query;

        const latestContests = await ContestService.getPreviousContestsByType(
          contestType,
          count
        );

        return h.response(latestContests);
      } catch (error) {
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },
  {
    method: "GET",
    path: "/get/contest-details",
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
    path: "/get/upcoming-contests",
    options:{
      description:"Get Upcoming Contests",
      tags:["api"],
    },
    handler: async (req,h)=>{
      try{
        // Call the scrapeContestData function to get upcoming contests data
        const upcomingContests = await ContestService.upcomingContestsIds();
  
        // Return the upcoming contests data as the response
        return h.response(upcomingContests);
      }catch (error) {
        console.error("Error:", error);
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    }
  },
];
