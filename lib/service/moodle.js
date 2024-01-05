const axios = require('axios');
const https = require('https');
const config = require('../config') 

const apiUrl = 'https://44.210.253.253/webservice/rest/server.php';
const token = config.Moodle.token;
const moodlewsrestformat = 'json';
const wsfunction = 'core_course_get_courses';

class Moodle {
    async moodle() {   
      const agent = new https.Agent({
        rejectUnauthorized: false,
      });
      
      // Define the request parameters
      const params = {
        wstoken: token,
        moodlewsrestformat,
        wsfunction,
      };

      // Make the GET request with the custom agent
      try {
        const response = await axios.get(apiUrl, { params, httpsAgent: agent });
        return response.data;
      } catch (error) {
        console.error('Request failed with error:', error);
        throw error; // Rethrow the error to propagate it to the handler
      }
    }


    async studentGrades(courseid, page = 1, pageSize = 10) {
      try {
        const courseId = courseid; //req.query.courseid;
        console.log(courseId,'courseId')
        if (!courseId) {
          throw new Error('Missing courseid parameter');
        }
    
        // Function 1: gradereport_user_get_grade_items
        const gradeItemsResponse = await axios.get('http://34.238.60.161/webservice/rest/server.php', {
          params: {
            wstoken: token,
            wsfunction: 'gradereport_user_get_grade_items',
            moodlewsrestformat: 'json',
            userid: 0,
            courseid: courseId,
          },
        });
    
        // Function 2: core_user_get_users
        const usersResponse = await axios.get('http://34.238.60.161/webservice/rest/server.php', {
          params: {
            wstoken: token,
            wsfunction: 'core_user_get_users',
            moodlewsrestformat: 'json',
            criteria: [{ key: 'All', value: 0 }],
          },
        });
    
        // Extract usergrades array from gradeItems
        const userGrades = gradeItemsResponse.data.usergrades || [];
    
        // Calculate the starting index based on the page and pageSize
        const startIndex = (page - 1) * pageSize;
    
        // Use Array.slice to get a subset of the userGrades array based on pagination
        const paginatedUserGrades = userGrades.slice(startIndex, startIndex + pageSize);
    
        // Combine the results based on the common user ID
        const combinedData = paginatedUserGrades.map((userGrade) => {
          const userId = userGrade.userid;
          const userData = usersResponse.data.users.find((user) => user.id === userId);
    
          if (userData) {
            return {
              userId: userId,
              userName: userData.username,
              email: userData.email,
              firstName: userData.firstname,
              lastName: userData.lastname,
              profilePicture: userData.profileimageurl,
              gradeItems: userGrade.gradeitems.map((gradeItem) => {
                return {
                  id: gradeItem.id,
                  itemName: gradeItem.itemname,
                  itemType: gradeItem.itemtype,
                  itemModule: gradeItem.itemmodule,
                  itemInstance: gradeItem.iteminstance,
                  categoryId: gradeItem.categoryid,
                  gradeFormatted: gradeItem.gradeformatted,
                  gradeMin: gradeItem.grademin,
                  gradeMax: gradeItem.grademax,
                  feedback: gradeItem.feedback,
                  percentage: gradeItem.percentageformatted,
                };
              }),
            };
          } else {
            return null; // Handle the case where no matching user data is found
          }
        }).filter(Boolean); // Remove null entries
    
        return {
          totalResults: userGrades.length,  // Total number of results without pagination
          totalPages: Math.ceil(userGrades.length / pageSize),
          currentPage: page,
          pageSize: pageSize,
          data: combinedData,
        };
      } catch (error) {
        console.error('Error fetching data:', error.message);
        throw new Error('Internal Server Error');
      }
    }
    

};
module.exports = new Moodle();
