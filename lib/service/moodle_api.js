const axios = require('axios');
const https = require('https');
const config = require('../config') 

const apiUrl = 'https://34.238.60.161//webservice/rest/server.php';
const token = '657d1e478afe4b4285252a7f351f0d8d';
const moodlewsrestformat = 'json';
const wsfunction = 'core_course_get_courses_by_field';

class Moodle2 {
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
        const Courses = response.data.courses.map((item) => {
          return {
            ID: item.id,
            CourseName: item.fullname,
            ShortName: item.shortname,
            contacts: item.contacts.map((contact) => {
              return {
                ContactID: contact.id, // assuming you have a property named 'id' for contacts
                ContactName: contact.fullname // assuming you have a property named 'fullname' for contacts
              };
            })
          };
        });
        return Courses;
      } catch (error) {
        console.error('Request failed with error:', error);
        throw error; // Rethrow the error to propagate it to the handler
      }
    }
    // Function 2: core_user_get_users
    async getUsersDetails() {
        try {
          const usersResponse = await axios.get('http://34.238.60.161/webservice/rest/server.php',
          {
            params: {
              wstoken: '657d1e478afe4b4285252a7f351f0d8d',
              wsfunction: 'core_user_get_users',
              moodlewsrestformat: 'json',
              criteria: [{ key: 'All', value: 0 }],
            },
          });
          const userData = await usersResponse.data.users;
          console.log(userData.length, 'userData');
          const simplifiedData = [];
          function toSentenceCase(str) {
            return str.toLowerCase().replace(/^(.)|\s+(.)/g, function ($1) {
              return $1.toUpperCase();
            });
          }
          for (const index in userData)
            {
              const simplified ={
            id: userData[index].id,
            username: userData[index].username,
            fullname: toSentenceCase(userData[index].fullname),
            email: userData[index].email,
            institution: userData[index].institution,
            customFields: userData[index].customfields.map((customField) => {
              return{
                Course:customField.value};
              }),
            };

            console.log(index);
            simplifiedData.push(simplified);;
          }
            return simplifiedData;
          }
         catch (error) {
          console.error(error);
          throw new Error('Failed to fetch Moodle user data');
        }
      }
  async GradesbyCourseContent(courseid) {
    try {
      const courseId = courseid; // req.query.courseid;
      console.log(courseId, 'courseId');
  
      if (!courseId) {
        throw new Error('Missing courseid parameter');
      }
  
      // Function 3: gradereport_user_get_grade_items
      const GradesbyCourse = await axios.get('http://34.238.60.161/webservice/rest/server.php', {
        params: {
          wstoken: '657d1e478afe4b4285252a7f351f0d8d',
          wsfunction: 'gradereport_user_get_grade_items',
          moodlewsrestformat: 'json',
          courseid: courseId,
        },
      });
  
      console.log(GradesbyCourse, 'GradesbyCourse');
  
      const data = GradesbyCourse.data.usergrades;
      console.log(data, 'data');
      const simplifiedData = [];
          function toSentenceCase(str) {
            return str.toLowerCase().replace(/^(.)|\s+(.)/g, function ($1) {
              return $1.toUpperCase();
            });
          }
          for (const index in data)
            {
              const simplified ={
            
            CorseId: data[index].id,
            UserId: data[index].userid,
            Name: toSentenceCase(data[index].userfullname),
            GradesView: data[index].gradeitems.map((grades) => {
              return{
                Courseid:grades.id,
                Itemname:grades.itemname,
                ObtainGrades:grades.graderaw,
                MaxGrades:grades.grademax,
                Percentage:grades.percentageformatted,
              };
              }),
            };

            console.log(index);
            simplifiedData.push(simplified);;
          }
            return simplifiedData;
            // return data;
      } 
     
     catch (error) {
      console.error('Error fetching data:', error.message);
      throw new Error('Internal Server Error');
    }
  }
}  
module.exports = new Moodle2();
