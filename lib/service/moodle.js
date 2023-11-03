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

};

module.exports = new Moodle();
