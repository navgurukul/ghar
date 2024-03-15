const axios = require('axios');
const https = require('https');
const config = require('../config') 

const apiUrl = 'https://34.238.60.161//webservice/rest/server.php';
const token = '657d1e478afe4b4285252a7f351f0d8d';
const moodlewsrestformat = 'json';
const wsfunction = 'core_course_get_courses_by_field';
// moodleservices

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
          const simplifiedData = [];
          function processName(str) {
            // Remove "Na" from the string
            const cleanedStr = str.replace(/ NA/g, '').trim();
            // Separate digits and special characters from the cleaned string
            const separatedStr = cleanedStr.replace(/[^a-zA-Z ]/g, '');
            return separatedStr.toLowerCase().replace(/^(.)|\s+(.)/g, function ($1) {
              return $1.toUpperCase();
            });
          }
          
          function isValidEmail(email) {
            // Basic email validation using a regular expression
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
          }
          for (const index in userData)
            {
            const simplified ={
            id: userData[index].id,
            username: userData[index].username,
            fullname: processName(userData[index].fullname),
            // email: userData[index].email,
            email: isValidEmail(userData[index].email) ? userData[index].email : null,
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
  async GradesbyCourseContent(userid, courseid) {
    try {
      const courseId = courseid; // req.query.courseid;
      const userId=userid;
      if (!courseId && !userId) {
        throw new Error('Missing courseid parameter');
      }
      // Function 3: gradereport_user_get_grade_items
      const GradesbyCourse = await axios.get('http://34.238.60.161/webservice/rest/server.php', {
        params: {
          wstoken: '657d1e478afe4b4285252a7f351f0d8d',
          wsfunction: 'gradereport_user_get_grade_items',
          moodlewsrestformat: 'json',
          courseid: courseId,
          userid:userId,
        },
      });
      const data = GradesbyCourse.data.usergrades[0].gradeitems;
      const simplifiedData = [];
      function toSentenceCase(str) {
        return str.toLowerCase().replace(/^(.)|\s+(.)/g, function ($1) {
          return $1.toUpperCase();
        });
        }
      for (const index in data)
        {
          const simplified ={  
            Courseid:data[index].id,
            Itemname:data[index].itemname,
            Itemtype:data[index].itemtype,
            Itemmodule:data[index].itemmodule,
            ObtainGrades:data[index].graderaw,
            MaxGrades:data[index].grademax,
            Percentage:data[index].percentageformatted,
          }
        simplifiedData.push(simplified);
      };
        return simplifiedData;
      }
     catch (error) {
      console.error('Error fetching data:', error.message);
      throw new Error('Internal Server Error');
    }
  }

  async fetchUserId(email) {
    const wstoken = config.Moodle.token;
    const url = `http://34.238.60.161/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_user_get_users&moodlewsrestformat=json&criteria[0][key]=email&criteria[0][value]=${email}`;
    const userData = await axios.get(url);
    if (userData.data.users.length === 0) return { error: "User not found" };
    const userId = userData.data.users[0].id;
    return userId;
  }

  async categoryAndCourses(email) {
    try {
      const userEmail = email;
      const userDataCategoryAndCourses = {
        data: {},
      };

      if (!userEmail) {
        throw new Error("Missing email parameter");
      }
      const wstoken = config.Moodle.token;
      // Function 4: core_course_get_categories
      const url = `http://34.238.60.161/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_user_get_users&moodlewsrestformat=json&criteria[0][key]=email&criteria[0][value]=${email}`;
      const userData = await axios.get(url);
      if (userData.data.users.length === 0) return { error: "User not found" };
      const userId = userData.data.users[0].id;

      const urlGetEnrolledCourses = `http://34.238.60.161/webservice/rest/server.php?wstoken=657d1e478afe4b4285252a7f351f0d8d&wsfunction=core_enrol_get_users_courses&moodlewsrestformat=json&userid=${userId}`;
      const enrolledCourses = await axios.get(urlGetEnrolledCourses);

      const categoryUrl = `http://34.238.60.161/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_course_get_categories&moodlewsrestformat=json`;
      const categories = await axios.get(categoryUrl);

      const gradeOverviewByCoursesUrl = `http://34.238.60.161/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=gradereport_overview_get_course_grades&moodlewsrestformat=json&userid=${userId}`;
      const gradeOverviewByCourses = await axios.get(gradeOverviewByCoursesUrl);

      const courseGrades = {};
      gradeOverviewByCourses.data.grades.forEach((grade) => {
        courseGrades[grade.courseid] = {
          grade: grade.grade,
          rawgrade: grade.rawgrade,
          rank: grade.rank,
        };
      });

      categories.data.forEach((cat) => {
        const categoryName = cat.name.toLowerCase();
        const coursesInCategory = enrolledCourses.data.filter(
          (c) => c.category === cat.id
        );
        if (coursesInCategory.length > 0) {
          userDataCategoryAndCourses.data[categoryName] =
            coursesInCategory.map(course=>{return {...course, grade: courseGrades[course.id]}});
        }
      });

      return userDataCategoryAndCourses;

      1;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to fetch Moodle user data");
    }
  }

  async allCoursesInCategoryWise(categoryId) {
    try {
      const userDataCategoryAndCourses = {
        data: {},
      };

      if (!categoryId) {
        throw new Error("Missing ID parameter");
      }
      const wstoken = config.Moodle.token; 

      const urlGetEnrolledCourses = `http://34.238.60.161/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_course_get_courses&moodlewsrestformat=json`;
      const enrolledCourses = await axios.get(urlGetEnrolledCourses);
      console.log(enrolledCourses.data, "enrolledCourses");
      const categoryUrl = `http://34.238.60.161/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_course_get_categories&moodlewsrestformat=json`;
      const categories = await axios.get(categoryUrl);
      console.log(categories.data, "categories");
      categories.data = categories.data.filter((cat) => cat.id === categoryId);

      categories.data.forEach((cat) => {
        const categoryName = cat.name.toLowerCase();
        const coursesInCategory = enrolledCourses.data.filter(
          (c) => c.categoryid === cat.id
        );
        userDataCategoryAndCourses.data[categoryName] = coursesInCategory;
      });

      console.log(userDataCategoryAndCourses);
      return userDataCategoryAndCourses;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to fetch Moodle user data");
    }
  }

  // Function to extract the module name from the criteria URL
  async processTopicResponse(topicResponse, completionStatus) {
    try {
      for (let i of topicResponse) {
        for (let j of i.modules) {
          for (let k of completionStatus.completionstatus.completions) {
            const regex = /id=(\d+)/;
            // Match the regular expression against the criteria string
            const match = k.details.criteria.match(regex);

            // Extract the ID if a match is found
            const criteriaId = match ? match[1] : null;
            if (j.id == criteriaId) {
              j.grade = {
                id:j.grade.id,
                itemname:j.grade.itemname,
                cmid:j.grade.cmid,
                gradeformatted:j.grade.gradeformatted,
                grademax:j.grade.grademax,
                percentageformatted:j.grade.percentageformatted,
                status: k.complete ? "Yes" : "No",
                timecompleted: k.timecompleted,
              };
            }
          }
        }
      }
      return topicResponse;
    } catch (error) {
      throw new Error(
        "An error occurred while processing topic response: " + error.message
      );
    }
  }
  // Function to find and update completion status in topicResponse
  async topicAndActivities(email, courseId) {
    try {
      console.log(email, "email", courseId, "courseId");
      const wstoken = config.Moodle.token;
      const userId = await this.fetchUserId(email);
      // console.log(userId, "userId");
      const topicsUrl = `http://34.238.60.161/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_course_get_contents&moodlewsrestformat=json&courseid=${courseId}`;
      let topicsResponse = await axios.get(topicsUrl);
      topicsResponse = topicsResponse.data;
      // console.log(topicsResponse, "topicsResponse");

      const gradeUrl = `http://34.238.60.161/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=gradereport_user_get_grade_items&moodlewsrestformat=json&courseid=${courseId}&userid=${userId}`;
      let grades = await axios.get(gradeUrl);
      grades = grades.data;

      const activityComplition = `http://34.238.60.161/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_completion_get_course_completion_status&moodlewsrestformat=json&courseid=${courseId}&userid=${userId}`;
      let activityStatus = await axios.get(activityComplition);
      activityStatus = activityStatus.data;

      for (let topic of topicsResponse) {
        for (let module of topic.modules) {
          for (let gradeItem of grades.usergrades[0].gradeitems) {
            if (module.id === gradeItem.cmid) {
              module.grade = {
                id: gradeItem.id,
                itemname: gradeItem.itemname,
                cmid: gradeItem.cmid,
                gradeformatted: gradeItem.gradeformatted,
                grademax: gradeItem.grademax,
                percentageformatted: gradeItem.percentageformatted,
              };
            }
          }
        }
      }
      // Filter out modules without grades
      for (let topic of topicsResponse) {
        topic.modules = topic.modules.filter((module) => module.grade);
      }

      const response = await this.processTopicResponse(
        topicsResponse,
        activityStatus
      );
      return response;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to fetch Moodle user data");
    }
  }

  async progressTrack(studentNgEmail, courseId) {
    try {
      const wstoken = config.Moodle.token;
      // const userId = await this.fetchUserId(email);
      const userEnrolledCourseTimeUrl = `http://34.238.60.161/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_enrol_get_enrolled_users&moodlewsrestformat=json&courseid=${courseId}`;
      let userEnrolledCourseTime = await axios.get(userEnrolledCourseTimeUrl);

      const courseDurationUrl = `http://34.238.60.161/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_course_get_courses&moodlewsrestformat=json`;
      let courseDuration = await axios.get(courseDurationUrl);
      courseDuration = courseDuration.data.filter((duration) => {
        return duration.id == courseId;
      });
      userEnrolledCourseTime = userEnrolledCourseTime.data.filter((user) => {
        return user.email == studentNgEmail;
      });
      const timeDiffMs =
        new Date(userEnrolledCourseTime[0].lastcourseaccess * 1000).getTime() -
        new Date(userEnrolledCourseTime[0].firstaccess * 1000).getTime();
      console.log(timeDiffMs, "days_difference");
      const dayDiff = Math.ceil(timeDiffMs / (1000 * 60 * 60 * 24));
      const startTimeIST = new Date(
        userEnrolledCourseTime[0].firstaccess * 1000
      ).toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      const lastAccessIST = new Date(
        userEnrolledCourseTime[0].lastaccess * 1000
      ).toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      const lastCourseAccessIST = new Date(
        userEnrolledCourseTime[0].lastcourseaccess * 1000
      ).toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      // Convert milliseconds to days
      userEnrolledCourseTime[0].firstaccess = startTimeIST;
      userEnrolledCourseTime[0].lastcourseaccess = lastCourseAccessIST;
      userEnrolledCourseTime[0].lastaccess = lastAccessIST;
      userEnrolledCourseTime[0].days = dayDiff;
      console.log(userEnrolledCourseTime, "userEnrolledCourseTime");

      userEnrolledCourseTime[0].courseMaxduration =
        courseDuration[0].customfields;
      // check progress track
      const progressTrackMinm =
        userEnrolledCourseTime[0].courseMaxduration[0].value * 7;
      const progressTrackMax =
        userEnrolledCourseTime[0].courseMaxduration[1].value * 7;
      if (userEnrolledCourseTime[0].days > progressTrackMax) {
        userEnrolledCourseTime[0].progress = "Behind";
      } else if (userEnrolledCourseTime[0].days < progressTrackMinm) {
        userEnrolledCourseTime[0].progress = "Ahead";
      } else {
        userEnrolledCourseTime[0].progress = "On Track";
      }

      //  Remove keys
      delete userEnrolledCourseTime[0].firstname;
      delete userEnrolledCourseTime[0].lastname;
      delete userEnrolledCourseTime[0].department;
      delete userEnrolledCourseTime[0].groups;
      delete userEnrolledCourseTime[0].roles;
      delete userEnrolledCourseTime[0].profileimageurlsmall;
      delete userEnrolledCourseTime[0].profileimageurl;
      delete userEnrolledCourseTime[0].customfields;
      delete userEnrolledCourseTime[0].country;
      delete userEnrolledCourseTime[0].enrolledcourses;
      delete userEnrolledCourseTime[0].descriptionformat;
      delete userEnrolledCourseTime[0].description;
      return userEnrolledCourseTime;
    } catch (err) {}
  }
}
module.exports = new Moodle2();
