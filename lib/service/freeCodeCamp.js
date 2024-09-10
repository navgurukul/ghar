const { pool } = require("../database/db");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");
const axios = require("axios");
const moment = require("moment");

class FreeCodeCamp {
  async FCC_Completed_Challenges(user_names) {
    try {
      const userChallengeIds = {};

      for (const user_name of user_names) {
        try {
          // Fetch user data from the FreeCodeCamp API
          const url = `https://api.freecodecamp.org/api/users/get-public-profile?username=${user_name}`;
          const userData = await axios.get(url);
          const user = userData.data.entities.user[user_name];

          // Extract completed challenge IDs, dates, and points if they exist
          const completedChallenges = user.completedChallenges
            ? user.completedChallenges.map((challenge) => ({
                id: challenge.id,
                completedDate: moment(challenge.completedDate).format(
                  "DD-MMM-YYYY"
                ),
                points: user.points,
              }))
            : [];

          // Store the challenge details in the result object
          userChallengeIds[user_name] = completedChallenges;
        } catch (error) {
          // If user not found, store "user not found"
          userChallengeIds[user_name] = "user not found";
        }
      }

      return userChallengeIds;
    } catch (error) {
      console.error("Error fetching challenge IDs:\n", error);
      return { result: error.message };
    }
  }
}

module.exports = new FreeCodeCamp();
