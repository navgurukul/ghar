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

  async FCC_Completed_Challenges_Filtered(userDateTimesStr, pagination = { page: 1, pageSize: 20 }) {
    try {
        const userChallengeIds = {};
  
        // Destructure pagination object and set default values if not provided
        const { page = 1, pageSize = 20 } = pagination || {};
  
        for (const entry of userDateTimesStr) {
            // Split each entry by the plus sign to separate the username and date-time
            const [user_name, dateTimeStr] = entry.split('+');
            console.log(`Processing user: ${user_name}, dateTimeStr: ${dateTimeStr}`);
  
            // Check if the dateTimeStr is already in Unix timestamp format
            let providedTimestamp = parseInt(dateTimeStr, 10);
            if (isNaN(providedTimestamp)) {
                console.error(`Error parsing dateTimeStr: ${dateTimeStr}`);
                providedTimestamp = null; // Set to null if the timestamp is invalid
            }
  
            console.log(`Parsed timestamp for ${user_name}: ${providedTimestamp}`);
  
            try {
                // Fetch user data from the FreeCodeCamp API
                const url = `https://api.freecodecamp.org/api/users/get-public-profile?username=${user_name}`;
                const userData = await axios.get(url);
                const user = userData.data.entities.user[user_name];
  
                // Extract and filter completed challenge IDs, dates, and points if they exist
                const completedChallenges = user.completedChallenges
                    ? user.completedChallenges
                        .filter((challenge) => {
                            const challengeTimestamp = challenge.completedDate;
                            console.log(`Challenge completedDate: ${challenge.completedDate}, challengeTimestamp: ${challengeTimestamp}`);
                            return !providedTimestamp || challengeTimestamp > providedTimestamp;
                        })
                    : [];
  
                // Implement pagination
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const paginatedChallenges = completedChallenges.slice(startIndex, endIndex)
                    .map((challenge) => ({
                        id: challenge.id,
                        date: challenge.completedDate,
                        completedDate: moment(challenge.completedDate).format("DD-MMM-YYYY"),
                        points: user.points,
                    }));
  
                // Store the filtered and paginated challenge details in the result object
                userChallengeIds[user_name] = paginatedChallenges;
            } catch (error) {
                // If user not found, store an empty array
                userChallengeIds[user_name] = [];
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
