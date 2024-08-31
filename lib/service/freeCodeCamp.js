const { pool } = require("../database/db");
const FCC = require("../models/freeCodeCamp");
const jwt = require("jsonwebtoken");
const config = require("../config");
const { google } = require("googleapis");
const sheets = google.sheets("v4");
const axios = require("axios");
const moment = require("moment");

class FreeCodeCamp {
  async fccCoursesInsertInDatabase() {
    try {
      // Configure a JWT auth client
      const authClient = new google.auth.JWT(
        config.googleSheet.client_email,
        null,
        config.googleSheet.private_key,
        ["https://www.googleapis.com/auth/spreadsheets"]
      );

      // Authenticate the JWT client
      await authClient.authorize();

      // Use the authenticated client to access the Sheets API
      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId: "1TbJJU27joJT0-jcFlGMS-C8fs5R2-E15GxlbnD31mCk",
        range: "Mapping", // Specify the range you want to access ("Pune Campus!A2:B18")
      });

      // Convert the array of values into an object with key-value pairs
      const values = response.data.values;

      // Fetch all existing records in one query
      const existingCourses = await FCC.findAll({
        where: {
          challenge_id: values.slice(1).map((row) => row[3]),
        },
      });

      // Create a map of existing records for quick lookup
      const existingCoursesMap = new Map();
      existingCourses.forEach((course) => {
        existingCoursesMap.set(course.challenge_id, course);
      });

      // Separate the data into two arrays: one for updates and one for inserts
      const updates = [];
      const inserts = [];

      for (let i = 1; i < values.length; i++) {
        const [certification, course_name, challenge_name, challenge_id] =
          values[i];
        if (existingCoursesMap.has(challenge_id)) {
          updates.push({
            certification,
            course_name,
            challenge_name,
            challenge_id,
          });
        } else {
          inserts.push({
            certification,
            course_name,
            challenge_name,
            challenge_id,
          });
        }
      }
      // Perform bulk updates
      for (const update of updates) {
        await FCC.update(
          {
            certification: update.certification,
            course_name: update.course_name,
            challenge_name: update.challenge_name,
          },
          { where: { challenge_id: update.challenge_id } }
        );
      }

      // Perform bulk inserts
      if (inserts.length > 0) {
        await FCC.bulkCreate(inserts);
      }

      console.log("Data inserted/updated successfully");
      return { result: "Data inserted/updated successfully" };
    } catch (err) {
      console.error("Error inserting/updating courses in database:\n", err);
      return { result: err.message };
    }
  }

  async fccChallengesCompletedByUsers(user_names) {
    try {
      const userChallenges = {};

      for (const user_name of user_names) {
        // Fetch user data from the FreeCodeCamp API
        const url = `https://api.freecodecamp.org/api/users/get-public-profile?username=${user_name}`;
        const userData = await axios.get(url);
        const user = userData.data.entities.user[user_name];

        // Check if completedChallenges exists
        let completedChallenges = [];
        if (user.completedChallenges) {
          // Extract completed challenge IDs
          const completedChallengeIds = user.completedChallenges.map(
            (challenge) => challenge.id
          );

          // Fetch the corresponding challenge details from the database
          const challengesCompletedByUser = await FCC.findAll({
            where: {
              challenge_id: completedChallengeIds,
            },
          });

          // Map the challenge details
          completedChallenges = challengesCompletedByUser.map((challenge) => ({
            challenge_id: challenge.challenge_id,
            challenge_name: challenge.challenge_name,
            course_name: challenge.course_name,
            certification: challenge.certification,
          }));
        }

        // Format the join date
        const formattedJoinDate = user.joinDate
          ? moment(user.joinDate).format("DD-MMM-YYYY")
          : null;

        // Create an object that includes the user details and the completed challenges
        const result = {
          user_name: user.username,
          name: user.name || null,
          location: user.location || null,
          points: user.points || null,
          joinDate: formattedJoinDate,
          completedChallenges:
            completedChallenges.length > 0
              ? completedChallenges
              : [{ message: "User didn't complete any challenges" }],
        };

        userChallenges[user_name] = result;
      }

      return userChallenges;
    } catch (error) {
      console.error("Error fetching challenges completed by users:\n", error);
      return { result: error.message };
    }
  }

  async numberOfChallengesCompleted(user_names) {
    try {
      const userChallengesCount = {};
      const allCourses = await FCC.findAll({
        attributes: ['course_name'],
        group: ['course_name']
      });

      const courseNames = allCourses.map(course => course.course_name);

      for (const user_name of user_names) {
        // Fetch user data from the FreeCodeCamp API
        const url = `https://api.freecodecamp.org/api/users/get-public-profile?username=${user_name}`;
        const userData = await axios.get(url);
        const user = userData.data.entities.user[user_name];

        // Initialize course-wise count with 0 for all courses
        let courseWiseCount = {};
        courseNames.forEach(course => {
          courseWiseCount[course] = 0;
        });

        // Check if completedChallenges exists
        if (user.completedChallenges) {
          // Extract completed challenge IDs
          const completedChallengeIds = user.completedChallenges.map(challenge => challenge.id);

          // Fetch the corresponding challenge details from the database
          const challengesCompletedByUser = await FCC.findAll({
            where: {
              challenge_id: completedChallengeIds
            }
          });

          // Count the number of challenges completed per course
          challengesCompletedByUser.forEach(challenge => {
            if (courseWiseCount[challenge.course_name] !== undefined) {
              courseWiseCount[challenge.course_name]++;
            }
          });
        }

        userChallengesCount[user_name] = courseWiseCount;
      }

      return userChallengesCount;
    } catch (error) {
      console.error("Error fetching number of challenges completed by users:\n", error);
      return { result: error.message };
    }
  }

}

module.exports = new FreeCodeCamp();
