const axios = require('axios');
const https = require('https');
const config = require('../config') 
const { zohoData, zohoDataForCopyOf } = require("../helpers/zohotoken");

const apiUrl = 'https://34.238.60.161//webservice/rest/server.php';
const token = '657d1e478afe4b4285252a7f351f0d8d';
const moodlewsrestformat = 'json';
const wsfunction = 'core_course_get_courses_by_field';
// moodleservices

class Moodle2 {
  async moodleDataUpdateOnZoho() {
    let updateData;
    try {
      const email = "ujjwal@navgurukul.org"; //"ghartech@navgurukul.org";
      const systemID = "163704000003306401"; //"163704000003353062";
      const reportName = "moodleCategory_Report";
      console.log(reportName, "1666666");
      // return zoho report data and access token
      const [data, token] = await zohoDataForCopyOf(reportName);
      console.log(data, "23333333333333");
      // console.log(data, "LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL");

      const headers = {
        Authorization: `Zoho-oauthtoken ${token}`,
        environment: "development",
        demo_user_name: "ujjwal@navgurukul.org",
        Accept: "application/json",
      };
      // return student category and courses enrolled in moodle
      const StudentCategoryAndCoursesRecord = await this.categoryAndCourses(
        email,
        true
      );
      console.log(data, typeof data,">>>>>>>>>>>>>>> data");

      let checkStudentInReportOrNot = [];
      if (Object.keys(data).length !== 0) {
          checkStudentInReportOrNot = data.data.filter((item) => {
            return item.navgurukul_email.Navgurukul_Email == email;
          });
      }
      // else {
      //   checkStudentInReportOrNot = data.data.filter((item) => {
      //     return item.navgurukul_email.Navgurukul_Email == email;
      // });
      // }
      //>>>>>>>>>>>>>>>>>>>>>>>
      // return
      console.log(
        checkStudentInReportOrNot,
        ">>>>>>>>>>checkStudentInReportOrNot"
      );
      console.log(data, typeof data, data.length, ">>>>>5222222>>>>>>>>>");
      if (Object.keys(data).length !== 0) {
        console.log("5444444444444444");
        if (data.data.length > 0) {
          // console.log('566666666666')
          for (let key in StudentCategoryAndCoursesRecord.data) {
            const categoryCheckInReport = checkStudentInReportOrNot.filter(
              async (item) => {
                if (
                  StudentCategoryAndCoursesRecord.data[key][0].category ==
                  item.Category_ID
                ) {
                  console.log("644444444444");
                  const zohoReportUrl = `https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/report/moodleCategory_Report/${item.ID}`;
                  updateData = {
                    data: [
                      {
                        // navgurukul_email: "163704000003194683",
                        Category_ID:
                          StudentCategoryAndCoursesRecord.data[key][0].category,
                        Category_Name: key,
                      },
                    ],
                  };
                  try {
                    // updating data in zoho moodleCategory Report if data is present in zoho
                    console.log("86666666666666666");
                    const response = await axios.patch(
                      zohoReportUrl,
                      updateData,
                      {
                        headers,
                      }
                    );
                  } catch (err) {
                    console.log(err, "955555errrrrrrrrrrrrrr");
                  }
                } else {
                  // console.log(
                  //   "item.categoyId - ",
                  //   item.Category_ID,
                  //   "\n",
                  //   StudentCategoryAndCoursesRecord.data[key][0].category
                  // );
                  console.log("KKKKKKKKKKKKKK");
                  let params;
                  const apiUrl =
                    "https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/report/" +
                    reportName;
                  let reportRead = await axios.get(apiUrl, {
                    headers,
                    params: params || {},
                  });
                  let container = [];
                  // console.log(reportRead.data, "1133333333333333333333");
                  for (let i = 0; i < reportRead.data.data.length; i++) {
                    container.push(Number(reportRead.data.data[i].Category_ID));
                  }
                  // console.log(container, "1022222222");
                  if (
                    !container.includes(
                      StudentCategoryAndCoursesRecord.data[key][0].category
                    )
                  ) {
                    console.log(
                      "inside 1ffffffff",
                      typeof StudentCategoryAndCoursesRecord.data[key][0]
                        .category
                    );
                    const zohoReportUrl = `https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/form/moodleCategory`;
                    // console.log(token, "token 37777777777");
                    updateData = {
                      data: [
                        {
                          navgurukul_email: systemID,
                          Category_ID:
                            StudentCategoryAndCoursesRecord.data[key][0]
                              .category,
                          Category_Name: key,
                        },
                      ],
                    };
                    // inserting data in zoho moodleCategory report if data is not present but present in moodle
                    console.log("103333333333");
                    const response = await axios.post(
                      zohoReportUrl,
                      updateData,
                      {
                        headers,
                      }
                    );
                  }
                }
              }
            );
          }
        }
      } else {
        console.log("1477777777777");
        // inserting if student is new in moodleCategory Report
        for (let key in StudentCategoryAndCoursesRecord.data) {
          // console.log("1100000000000  -  ", checkStudentInReportOrNot.length);
          const zohoReportUrl = `https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/form/moodleCategory`;
          // console.log(token, "token 37777777777");
          updateData = {
            data: [
              {
                navgurukul_email: systemID,
                Category_ID:
                  StudentCategoryAndCoursesRecord.data[key][0].category,
                Category_Name: key,
              },
            ],
          };
          // inserting data in zoho moodleCategory report if data is not present but present in moodle
          // console.log("103333333333", updateData);
          const response = await axios.post(zohoReportUrl, updateData, {
            headers,
          });
        }
      }
      return checkStudentInReportOrNot;
      // console.log(email);
    } catch (err) {
      console.log(err, ">>>>>>>>>>>>>>>>>>>>>");
      return err;
    }
  }

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

  async fetchUserId(email,ip_address) {
    const wstoken = config.Moodle.token;
    // core_user_get_users function to get the user details like id, name, etc
    const url = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_user_get_users&moodlewsrestformat=json&criteria[0][key]=email&criteria[0][value]=${email}`;
    const userData = await axios.get(url);
    if (userData.data.users.length === 0) return { error: "User not found" };
    const userId = userData.data.users[0].id;
    return userId;
  }

  async categoryAndCourses(email, checkProdOrDev) {
    try {
      const userEmail = email;
      const userDataCategoryAndCourses = {
        data: {},
      };

      if (!userEmail) {
        throw new Error("Missing email parameter");
      }
      let wstoken;
      let ip_address;
      if (checkProdOrDev == true) {
        wstoken = config.Moodle.token;
        ip_address = config.Moodle.ip_address;
      } else {
        wstoken = config.Moodle.tokenDev;
        ip_address = config.Moodle.ip_addressDev;
      }
      
      const userId = await this.fetchUserId(email,ip_address);

      // core_enrol_get_users_courses function to get the user enrolled courses
      const urlGetEnrolledCourses = `http://${ip_address}/webservice/rest/server.php?wstoken=657d1e478afe4b4285252a7f351f0d8d&wsfunction=core_enrol_get_users_courses&moodlewsrestformat=json&userid=${userId}`;
      const enrolledCourses = await axios.get(urlGetEnrolledCourses);

      // core_course_get_categories function to get the all categories inside moodle site
      const categoryUrl = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_course_get_categories&moodlewsrestformat=json`;
      const categories = await axios.get(categoryUrl);

      // gradereport_overview_get_course_grades function to get the grades of user in each course
      const gradeOverviewByCoursesUrl = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=gradereport_overview_get_course_grades&moodlewsrestformat=json&userid=${userId}`;
      const gradeOverviewByCourses = await axios.get(gradeOverviewByCoursesUrl);

      const courseGrades = {};
      // Store the grades of user in each course
      gradeOverviewByCourses.data.grades.forEach((grade) => {
        courseGrades[grade.courseid] = {
          grade: grade.grade,
          rawgrade: grade.rawgrade,
          rank: grade.rank,
        };
      });
      // Store the courses in each category
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
            if (j.grade) {
              if (j.id == criteriaId) {
                j.grade = {
                  id: j.grade.id,
                  itemname: j.grade.itemname,
                  cmid: j.grade.cmid,
                  gradeformatted: j.grade.gradeformatted,
                  grademax: j.grade.grademax,
                  percentageformatted: j.grade.percentageformatted,
                  status: k.complete ? "Yes" : "No",
                  timecompleted: new Date(k.timecompleted * 1000)
                    .toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                    .split("/")
                    .reverse()
                    .join(" "),
                };
              }
            }
            else{
                j.grade={
                  status: k.complete ? "Yes" : "No",
                  timecompleted: new Date(k.timecompleted * 1000)
                    .toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                    .split("/")
                    .reverse()
                    .join(" "),
              }
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
  async topicAndActivities(email, courseId, checkProdOrDev) {
    try {
      let wstoken;
      let ip_address;
      if (checkProdOrDev == true) {
        wstoken = config.Moodle.token;
        ip_address = config.Moodle.ip_address;
      } else {
        wstoken = config.Moodle.tokenDev;
        ip_address = config.Moodle.ip_addressDev;
        console.log(ip_address, "ip_address");
      }
      // return moodle userId
      const userId = await this.fetchUserId(email,ip_address);

      // Function core_course_get_contents tell us about the Topic within a course
      const topicsUrl = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_course_get_contents&moodlewsrestformat=json&courseid=${courseId}`;
      let topicsResponse = await axios.get(topicsUrl);
      topicsResponse = topicsResponse.data;

      // Function gradereport_user_get_grade_items tell us about the grade of a user in an activity
      const gradeUrl = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=gradereport_user_get_grade_items&moodlewsrestformat=json&courseid=${courseId}&userid=${userId}`;
      let grades = await axios.get(gradeUrl);
      grades = grades.data;

      // Function core_completion_get_course_completion_status tell us about the completion status of an activity
      const activityComplition = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_completion_get_course_completion_status&moodlewsrestformat=json&courseid=${courseId}&userid=${userId}`;
      let activityStatus = await axios.get(activityComplition);
      activityStatus = activityStatus.data;

      // Update the topicsResponse with the grade and completion status
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

  async progressTrack(studentNgEmail, courseId, progressTrack) {
    try {
      let wstoken; // moodle authontication token
      let ip_address; // moodle ip address
      if (progressTrack == true) {
        wstoken = config.Moodle.token;
        ip_address = config.Moodle.ip_address;
      } else {
        wstoken = config.Moodle.tokenDev;
        ip_address = config.Moodle.ip_addressDev;
      }

      // Function  core_enrol_get_enrolled_users tell us about the user enrolled courses and their time
      const userEnrolledCourseTimeUrl = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_enrol_get_enrolled_users&moodlewsrestformat=json&courseid=${courseId}`;
      let userEnrolledCourseTime = await axios.get(userEnrolledCourseTimeUrl);

      // Function core_course_get_courses tell us about the course duration
      const courseDurationUrl = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_course_get_courses&moodlewsrestformat=json`;
      let courseDuration = await axios.get(courseDurationUrl);
      courseDuration = courseDuration.data.filter((duration) => {
        return duration.id == courseId;
      });

      // Filter out the specific user enrolled courses and their time
      userEnrolledCourseTime = userEnrolledCourseTime.data.filter((user) => {
        return user.email == studentNgEmail;
      });

      // time difference between last course access and first course access
      const timeDiffMs =
        new Date(userEnrolledCourseTime[0].lastcourseaccess * 1000).getTime() -
        new Date(userEnrolledCourseTime[0].firstaccess * 1000).getTime();
      const dayDiff = Math.ceil(timeDiffMs / (1000 * 60 * 60 * 24));
      
      // Convert milliseconds to dd-mm-yyyy
      const startTimeIST = new Date(
        userEnrolledCourseTime[0].firstaccess * 1000
      )
        .toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .split("/") 
        .reverse()   
        .join(" ");

      const lastAccessIST = new Date(
        userEnrolledCourseTime[0].lastaccess * 1000
      ).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).split("/") 
      .reverse()   
      .join(" ");

      const lastCourseAccessIST = new Date(
        userEnrolledCourseTime[0].lastcourseaccess * 1000
      ).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .split("/") 
      .reverse()   
      .join(" ");

      // Convert milliseconds to days
      userEnrolledCourseTime[0].firstaccess = startTimeIST;
      userEnrolledCourseTime[0].lastcourseaccess = lastCourseAccessIST;
      userEnrolledCourseTime[0].lastaccess = lastAccessIST;
      userEnrolledCourseTime[0].days = dayDiff;
      console.log(userEnrolledCourseTime, "userEnrolledCourseTime");

      userEnrolledCourseTime[0].courseMaxduration =
        courseDuration[0].customfields;

      // check progress track of a user
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
