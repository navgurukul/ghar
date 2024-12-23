const axios = require("axios");
const https = require("https");
const config = require("../config");
const {
  refreshToken,
  zohoData,
  zohoDataForCopyOf,
  callHeaders,
} = require("../helpers/zohotoken");

const apiUrl = 'https://34.238.60.161//webservice/rest/server.php';
const token = '657d1e478afe4b4285252a7f351f0d8d';
const moodlewsrestformat = 'json';
const wsfunction = 'core_course_get_courses_by_field';
// moodleservices

class Moodle2 {

  async fetchUserId(email, ip_address, wstoken) {
    // core_user_get_users function to get the user details like id, name, etc
    const url = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_user_get_users&moodlewsrestformat=json&criteria[0][key]=email&criteria[0][value]=${email}`;
    const userData = await axios.get(url);
    if (userData.data.users.length === 0) return { error: "User not found" };
    const userId = userData.data.users[0].id;
    return userId;
  }

  async categoryAndCourses(emails, checkProdOrDev) {
    try {
      const usersData = [];
  
      const baseBatchSize = 15;
      const maxBatchSize = 100;
  
      const batchSize = Math.min(maxBatchSize, Math.max(baseBatchSize, Math.ceil(emails.length / 5)));
  
      for (let i = 0; i < emails.length; i += batchSize) {
        const emailBatch = emails.slice(i, i + batchSize);
  
        const batchResults = await Promise.all(emailBatch.map(async (email) => {
          try {
            const userEmail = email;
            const userDataCategoryAndCourses = {};
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
  
            const userId = await this.fetchUserId(email, ip_address, wstoken);
  
            const urlGetEnrolledCourses = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_enrol_get_users_courses&moodlewsrestformat=json&userid=${userId}`;
  
            const categoryUrl = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_course_get_categories&moodlewsrestformat=json`;
  
            const gradeOverviewByCoursesUrl = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=gradereport_overview_get_course_grades&moodlewsrestformat=json&userid=${userId}`;
  
            const [enrolledCourses, categories, gradeOverviewByCourses] = await Promise.all([
              axios.get(urlGetEnrolledCourses),
              axios.get(categoryUrl),
              axios.get(gradeOverviewByCoursesUrl)
            ]);

            if (enrolledCourses.data.length === 0) {
              return { error: [userEmail]+"-"+"not active" };
            }
  
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
                userDataCategoryAndCourses[userEmail] = {
                  ...userDataCategoryAndCourses[userEmail],
                  [categoryName]: {
                    category: cat.id,
                  },
                };
              }
            });
  
            return userDataCategoryAndCourses;
          } catch (error) {
            console.error(`Error fetching data for email ${email}: ${error.message}`);
            return { error: `${email}-not found` };
          }
        }));
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        usersData.push(...batchResults);
      }
  
      return usersData;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to fetch Moodle user data");
    }
  }
  
  async coursesInMoodleWhereUserEnrolled(emails, checkProdOrDev) {
    try {
        const userData = new Map();

        // Dynamic batch size based on email count
        const baseBatchSize = 15; // Adjust this base value
        const maxBatchSize = 100; // Adjust this maximum value

        const batchSize = Math.min(maxBatchSize, Math.max(baseBatchSize, Math.ceil(emails.length / 5))); // Dynamic calculation

        for (let i = 0; i < emails.length; i += batchSize) {
            const emailBatch = emails.slice(i, i + batchSize);

            await Promise.all(emailBatch.map(async (email) => {
              try {
                  if (!email) {
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
          
                  const userId = await this.fetchUserId(email, ip_address, wstoken);
          
                  const urlGetEnrolledCourses = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_enrol_get_users_courses&moodlewsrestformat=json&userid=${userId}`;
          
                  const categoryUrl = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_course_get_categories&moodlewsrestformat=json`;
                  const durationUrl = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_course_get_courses&moodlewsrestformat=json`

                  const [enrolledCourses, categories,courseDuration] = await Promise.all([
                      axios.get(urlGetEnrolledCourses),
                      axios.get(categoryUrl),
                      axios.get(durationUrl),
                  ]);

                  // Map over enrolledCourses and enrich each course with categoryName
                  const enrichedCourses = enrolledCourses.data.map(course => {
                      const category = categories.data.find(cat => cat.id === course.category);
                      const duration = courseDuration.data.find(duration => duration.id === course.id);
                      const categoryName = category ? category.name : 'Unknown'; // Default to 'Unknown' if category is not found
                      return {
                        id: course.id,
                        shortname: course.shortname,
                        fullname: course.fullname,
                        displayname: course.displayname,
                        categoryName,
                        categoryId: course.category,
                        complitionFlag: course.completed,
                        minDuration: Number(duration.customfields[0].value),
                        maxDuration: Number(duration.customfields[1].value),
                    };
                  });
          
                  // Add enriched courses to userData under email key
                  if (!userData.has(email)) {
                      userData.set(email, []);
                  }
                  userData.get(email).push(...enrichedCourses);
              } catch (error) {
                  // console.error(`Error processing email ${email}: ${error}`);
                  userData.set(email, [{ error: `${email}-not found` }]);
              }
          }));
        }

        // Convert Map to object while maintaining the order of insertion
        const orderedUserData = {};
        userData.forEach((value, key) => {
            orderedUserData[key] = value;
        });

        return orderedUserData;
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
            let status = k.hasOwnProperty("complete") ? k.complete : false;
            // Extract the ID if a match is found
            const criteriaId = match ? match[1] : null;
            if (j.grade) {
              if (j.id == criteriaId) {
                j.grade = {
                  id: j.grade.id,
                  itemname: j.grade.itemname,
                  cmid: j.grade.cmid,
                  gradeformatted:
                    j.grade.gradeformatted == "-" ? "" : j.grade.gradeformatted,
                  grademax: j.grade.grademax,
                  percentageformatted:
                    j.grade.percentageformatted == "-"
                      ? ""
                      : j.grade.percentageformatted.split(" ")[0],
                  status: k.complete ? "true" : "false",
                  timecompleted:
                    new Date(k.timecompleted * 1000)
                      .toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                      .split(" ")
                      .join("-") == "01-Jan-1970"
                      ? ""
                      : new Date(k.timecompleted * 1000)
                          .toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                          .split(" ")
                          .join("-"),
                };
              }
            } else {
              j.grade = {
                id: "",
                itemname: "",
                cmid: "",
                gradeformatted: "",
                grademax: "",
                percentageformatted: "",
                status: j.modname.toLowerCase() == "forum" ? "true" : "false",
                timecompleted:
                  new Date(k.timecompleted * 1000)
                    .toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                    .split(" ")
                    .join("-") == "01-Jan-1970"
                    ? ""
                    : new Date(k.timecompleted * 1000)
                        .toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                        .split(" ")
                        .join("-"),
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

  // filtering the submative assessment topic and concatinate the completed topic
  async filteringSubmativeAssessment(topicResponse) {
    try {
      let completedTopic = "";
      let notCompletedTopic = "";
      let minimumDateAmongTopics = null;
      for (let topic of topicResponse) {
        let date;
        if (topic.minDate != null || topic.minDate != undefined) {
          date = new Date(topic.minDate);
        }
        if(date!=undefined){
          if (minimumDateAmongTopics === null || date < minimumDateAmongTopics) {
            minimumDateAmongTopics = date;
          }
        }

        if (topic.complitionFlag == true) {
          completedTopic += topic.name + " | ";
        }else{
          notCompletedTopic += topic.name + " | ";
        }
      }
      
       // Use a regular expression pattern as a string
       const regex = /summative assessment/i;

      // Filter topics based on the regex pattern
      topicResponse = topicResponse.filter((topic) => {
        return regex.test(topic.name.toLowerCase());
      });
      
      if(topicResponse.length>0){

        if(topicResponse[0].completedActivity==topicResponse[0].totalActivity && topicResponse[0].totalActivity>0){
          topicResponse[0].complitionFlag = true;
        }else{
          topicResponse[0].complitionFlag = false;
        }
        let SummativeAssAvg = 0;
        let activityCompletedInSummative = 0;
        const date = new Date(minimumDateAmongTopics);
        const formattedDate = `${date.getDate()}-${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;

        topicResponse[0].minDate = formattedDate=="1-Jan-1970" ?null:formattedDate;

        for (let activity of topicResponse[0].modules) {
          // Assuming minimumDateAmongTopics is in the format "2024-06-06T18:30:00.000Z"

          
          if (
            activity.grade.status == "true" &&
            activity.modname.toLowerCase() != "forum"
          ) {
            activityCompletedInSummative += 1;
          }
          if (
            activity.grade.percentageformatted !== "" &&
            activity.grade.status == "true"
          ) {
            SummativeAssAvg += parseInt(activity.grade.percentageformatted);
          }
          if (
            activity.grade.percentageformatted == "" &&
            activity.grade.status == "true"
          ) {
            SummativeAssAvg += 100;
          }
          if (activityCompletedInSummative > 0) {
            topicResponse[0].avgScoreInPercentage =
              SummativeAssAvg / activityCompletedInSummative;
          }
        }
    }

       // Remove the trailing " || " if it exists
      completedTopic = completedTopic.replace(/\s*\|\s*$/, '');
      notCompletedTopic = notCompletedTopic.replace(/\s*\|\s*$/, '');

      let data = {
        response: topicResponse,
        result: {completedTopic,notCompletedTopic},
      }
      return data;

    }catch(error){
      console.log(error,'>>>>> line 876')
      return error;
    }
}


  async progressTrack(studentNgEmails, courseId, progressTrack) {
    try {
      let wstoken; // moodle authentication token
      let ip_address; // moodle ip address
      if (progressTrack == true) {
        wstoken = config.Moodle.token;
        ip_address = config.Moodle.ip_address;
      } else {
        wstoken = config.Moodle.tokenDev;
        ip_address = config.Moodle.ip_addressDev;
      }
  
      // Construct URLs for the API calls
      const userEnrolledCourseTimeUrl = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_enrol_get_enrolled_users&moodlewsrestformat=json&courseid=${courseId}`;
      const courseDurationUrl = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_course_get_courses&moodlewsrestformat=json`;
  
      // Make the API calls concurrently
      const [userEnrolledCourseTimeResponse, courseDurationResponse] = await Promise.all([
        axios.get(userEnrolledCourseTimeUrl),
        axios.get(courseDurationUrl)
      ]);
  
      let courseDuration = courseDurationResponse.data.filter(duration => duration.id == courseId);
      // Create an array of promises, each of which gets the progress track for one student
      const progressTracks = await Promise.all(studentNgEmails.map(async (studentNgEmail) => {
        let userEnrolledCourseTime = userEnrolledCourseTimeResponse.data.filter(user => user.email.toLowerCase() == studentNgEmail.toLowerCase());
        // If no user data found for this email, return a custom response
        if (userEnrolledCourseTime.length === 0) {
          return {
            email: studentNgEmail,
            error: 'No data found for this email'
          };
        }
        
        // Convert milliseconds to dd-mm-yyyy
        const startTimeIST = new Date(
          userEnrolledCourseTime[0].firstaccess * 1000
        )
          .toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          .split(" ")
          .map((part, index) => index === 1 ? part.substring(0, 3) : part)
          .join("-")
  
        const lastAccessIST = new Date(
          userEnrolledCourseTime[0].lastaccess * 1000
        ).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .split(" ")
        .map((part, index) => index === 1 ? part.substring(0, 3) : part)
        .join("-")
  
        const lastCourseAccessIST = new Date(
          userEnrolledCourseTime[0].lastcourseaccess * 1000
        ).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .split(" ")
        .join("-");
  
        // Convert milliseconds to days
        userEnrolledCourseTime[0].firstaccess = startTimeIST;
        userEnrolledCourseTime[0].lastcourseaccess = lastCourseAccessIST;
        userEnrolledCourseTime[0].lastaccess = lastAccessIST;
        // userEnrolledCourseTime[0].days = dayDiff;
  
        userEnrolledCourseTime[0].courseMaxduration =
          courseDuration[0].customfields;
        
        userEnrolledCourseTime[0].minDuration = Number(userEnrolledCourseTime[0].courseMaxduration[0].value);
        userEnrolledCourseTime[0].maxDuration = Number(userEnrolledCourseTime[0].courseMaxduration[1].value);

     
        //  Remove keys
        delete userEnrolledCourseTime[0].courseMaxduration;      
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
  
        return userEnrolledCourseTime[0];
      }));
  
      // Convert the array of progress tracks to an object
      const progressTracksObject = progressTracks.reduce((obj, track) => {
        let emailInLowerCase = track.email.toLowerCase();
        obj[emailInLowerCase] = track;
        return obj;
      }, {});
      return progressTracksObject;
    } catch (err) {}
  }

  async topicAndActivities(emails, courseId, checkProdOrDev) {
    try {
      const userData = {};
      let criterNotSet = ""
      const userResults = await Promise.all(
        emails.map(async (email) => {
          try {
            const userEmail = email;

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

            const userId = await this.fetchUserId(email, ip_address, wstoken);

            const topicsUrl = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_course_get_contents&moodlewsrestformat=json&courseid=${courseId}`;
            const gradeUrl = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=gradereport_user_get_grade_items&moodlewsrestformat=json&courseid=${courseId}&userid=${userId}`;
            const activityComplition = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_completion_get_course_completion_status&moodlewsrestformat=json&courseid=${courseId}&userid=${userId}`;

            let [topicsResponse, grades, activityStatus] = await Promise.all([
              axios.get(topicsUrl),
              axios.get(gradeUrl),
              axios.get(activityComplition),
            ]);
            topicsResponse = topicsResponse.data;
            grades = grades.data;
            activityStatus = activityStatus.data;
            console.log(activityStatus, "activityStatus");
            if(activityStatus.hasOwnProperty('message')){
              criterNotSet = activityStatus.message;
            }

            // Update topicsResponse with grades and completion status
            for (let topic of topicsResponse) {
              for (let module of topic.modules) {
                for (let gradeItem of grades.usergrades[0].gradeitems) {
                  if (module.id === gradeItem.cmid) {
                    module.grade = {
                      id: gradeItem.id,
                      itemname: gradeItem.itemname,
                      cmid: gradeItem.cmid,
                      gradeformatted:
                        gradeItem.gradeformatted === "-"
                          ? ""
                          : gradeItem.gradeformatted,
                      grademax: gradeItem.grademax,
                      percentageformatted:
                        gradeItem.percentageformatted === "-"
                          ? ""
                          : gradeItem.percentageformatted.split(" ")[0],
                    };
                    // module.completionStatus = activityStatus.completionstatuses.find(status => status.cmid === module.id)?.completionstatus; // Access completion status using optional chaining
                  }
                }
              }
            }

            // Process the data further in processTopicResponse
            let response = await this.processTopicResponse(
              topicsResponse,
              activityStatus
            );

            let activityCompletedOfEachTopic = response.reduce(
              (count, item) => {
                return (
                  count +
                  item.modules.reduce((subCount, module) => {
                    return (
                      subCount +
                      (module.grade.status == "true" &&
                      module.modname.toLowerCase() != "forum"
                        ? 1
                        : 0)
                    );
                  }, 0)
                );
              },
              0
            );
            response.activityCompletedOfEachTopic =
              activityCompletedOfEachTopic;

            delete response[0].visible;
            delete response[0].summary;
            delete response[0].summaryformat;
            delete response[0].section;
            delete response[0].hiddenbynumsections;
            delete response[0].uservisible;
            // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
            // .....................calculation part..............................
            // Initialize totalActivityOfThisModule before the loop
            let minDate = [];
            let totalActivityOfThisModule = 0;
            let minumDate = null;
            let maxDate = null;
            let leastDateAmongActivity;
            let highestDateAmongActivity;
            for (let topic of response) {
              let checkFlag = [];
              // const totalActivityOfAllTopic = topic.modules.length;
              // topic.totalActivityOfAllTopic = totalActivityOfAllTopic;
              const totalActivity = topic.modules.length;
              topic.totalActivity = totalActivity;
              topic.activityCompletedOfEachTopic = activityCompletedOfEachTopic;
              let completedActivity = 0;
              let complitionFlag = false;
              let avgPercentage = 0;



              // let latestTime = new Date("1970-01-01").toString();

              // totalActivityOfThisModule += totalActivityOfAllTopic;
              if (topic.modules.length > 0) {
                for (let activity of topic.modules) {
                  let date;
                  if (
                    activity.modname.toLowerCase() !== "forum" &&
                   ( activity.grade.timecompleted !== "" && activity.grade.timecompleted !== undefined)
                  ) {
                    date = new Date(activity.grade.timecompleted);
                    if (minumDate === null || date < minumDate) {
                      minumDate = date;
                    }if (maxDate === null || date > maxDate) {
                      maxDate = date;
                    }
                  }
                }
                if (minumDate) {
                  let month = minumDate
                    .toLocaleString("default", { month: "short" })
                    .slice(0, 3);
                  leastDateAmongActivity =
                    minumDate.getDate() +
                    "-" +
                    month +
                    "-" +
                    minumDate.getFullYear();
                }
                if (maxDate) {
                  let month = maxDate
                    .toLocaleString("default", { month: "short" })
                    .slice(0, 3);
                    highestDateAmongActivity =
                    maxDate.getDate() +
                    "-" +
                    month +
                    "-" +
                    maxDate.getFullYear();
                }
                for (let activity of topic.modules) {
                  if (activity.grade.status == "true") {
                    completedActivity++;
                  }
                  if (activity.grade.status == "false") {
                    complitionFlag = false;
                  } else {
                    checkFlag.push(true);
                    complitionFlag = true;
                  }
                  if (activity.modname.toLowerCase() !== "forum") {
                    totalActivityOfThisModule += 1;
                    if (activity.grade.timecompleted !== "") {
                      if(activity.grade.timecompleted !=undefined){
                        minDate.push(activity.grade.timecompleted);
                      }
                    }
                  }

                  topic.totalActivityOfThisModule = totalActivityOfThisModule;
                  // topic.avgPercentage = avgPercentage / totalActivity;
                  topic.completedActivity = completedActivity;
                  topic.complitionFlag =
                    checkFlag.length == topic.modules.length ? true : false;

                  topic.latestTime = ( highestDateAmongActivity != undefined &&
                  highestDateAmongActivity != "NaN-Inv-NaN")
                    ? highestDateAmongActivity
                    : null; 
                  console.log(topic.latestTime,'>>>>>>>>>>>>>')
                  topic.minDate =
                    leastDateAmongActivity != undefined &&
                    leastDateAmongActivity != "NaN-Inv-NaN"
                      ? leastDateAmongActivity
                      : null;
                }
              } else {
                topic.totalActivityOfThisModule = 0;
                topic.avgPercentage = 0;
                topic.completedActivity = 0;
                topic.complitionFlag = false;
                topic.latestTime = null;
                topic.minDate = null;
              }
            }

  // ...............Filtering the submative assessment topic and concatinate the completed topic.......................          

            const finalResponse = await this.filteringSubmativeAssessment(
              response
            );

            // Add totalActivityOfThisModule to the finalResponse object
            finalResponse.TotalActivityOfThisModule = totalActivityOfThisModule;
            finalResponse.activityCompletedOfEachTopic =
              activityCompletedOfEachTopic;

            // ... Your calculations and processing logic for response ...
            userData[userEmail] = {
              // Update key here to userEmail
              finalResponse,
            };
          } catch (error) {
            console.log(error, ">>>>>>>>>>>>>>>>>>>>>>");
            if(criterNotSet !== ""){
              userData[email] = {
                error: criterNotSet,
              };
            }else{
              // console.error(`Error for email ${email}: ${error.message}`);
              userData[email] = {
                error: `${email}-not found`,
              };
            }
          }
          return userData;
        })
      );

      const result = {};
      for (const email in userData) {
        if (userData.hasOwnProperty(email)) {
          if (userData[email].finalResponse) {
            const topicId =
              userData[email].finalResponse.response.length > 0
                ? userData[email].finalResponse.response[0].id
                : null;
            const user = topicId
              ? userData[email].finalResponse.response[0]
              : null;
            const topicName = user ? user.name : null;
            const totalActivity = user ? user.totalActivity : null;
            const completedActivity = user ? user.completedActivity : null;
            const complitionFlag = user ? user.complitionFlag : null;
            const latestActivity = user ? user.latestTime : null;
            const minActivityTime = user ? user.minDate : null;
            const avgPercentage = user ? (user.avgScoreInPercentage || 0) : 0;
            const notCompletedTopic =
              userData[email].finalResponse.result.notCompletedTopic;
            const completed =
              userData[email].finalResponse.result.completedTopic;

            result[email] = {
              topicId: topicId,
              topicName: topicName != undefined ? topicName.trim() : null,
              totalActivity: totalActivity,
              completedActivity: completedActivity,
              avgPercentage: avgPercentage,
              notCompletedTopic: notCompletedTopic,
              completedTopic: completed,
              complitionFlag: complitionFlag,
              latestActivity: latestActivity,
              minActivityTime: minActivityTime,
              totalActivityOfThisModule:
                userData[email].finalResponse.TotalActivityOfThisModule,
              activityCompletedOfEachTopic:
                userData[email].finalResponse.activityCompletedOfEachTopic,
            };
            const completedTopicsCount =
              completed == "" ? 0 : completed.split("|").length;
            const notCompletedTopicsCount =
              notCompletedTopic == "" ? 0 : notCompletedTopic.split("|").length;
            result[email].totalTopicsCount =
              completedTopicsCount + notCompletedTopicsCount;
            result[email].completedTopicCount = completedTopicsCount;
          } else {
            result[email] = {
              error: userData[email].error || "Unknown error",
            };
          }
        }
      }

      return result;
      // console.log(flattenedResults,'>>>>>>>>>>>>>')
      // return flattenedResults; // Return array of user data objects
    } catch (error) {
      console.error(error);
      throw new Error("Failed to fetch Moodle user data");
    }
  }

  async missingActivitiesSettings(email, courseId, checkProdOrDev) {
    try {
      let wstoken;
      let ip_address;
      if (checkProdOrDev == true) {
        wstoken = config.Moodle.token;
        ip_address = config.Moodle.ip_address;
      } else {
        wstoken = config.Moodle.tokenDev;
        ip_address = config.Moodle.ip_addressDev;
      }
      const userId = await this.fetchUserId(email, ip_address, wstoken);
      const topicsUrl = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_course_get_contents&moodlewsrestformat=json&courseid=${courseId}`;
      const activityComplition = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_completion_get_course_completion_status&moodlewsrestformat=json&courseid=${courseId}&userid=${userId}`;

      let [topicsResponse, activityStatus] = await Promise.all([
        axios.get(topicsUrl),
        axios.get(activityComplition),
      ]);
      topicsResponse = topicsResponse.data;
      activityStatus = activityStatus.data;
      if(activityStatus.hasOwnProperty('message')){
       
        return { error: activityStatus.message };
      }
      // Extract module IDs from topicsResponse
      const topicModuleIds = topicsResponse.flatMap((topic) =>
        topic.modules.map((module) => module.id)
      );
      // Extract IDs from activityStatus
      const activityIds = activityStatus.completionstatus.completions
        .map((completion) => {
          const match = completion.details.criteria.match(/id=(\d+)/);
          return match ? parseInt(match[1], 10) : null;
        })
        .filter((id) => id !== null);
      // Find missing IDs in topicsResponse that are present in activityStatus
      const missingInTopics = topicModuleIds.filter(
        (id) => !activityIds.includes(id)
      );
      const missingData = missingInTopics.map((missingId) => {
        // Find the module in topicsResponse that matches the missingId
        for (const topic of topicsResponse) {
          const module = topic.modules.find((m) => m.id === missingId);
          if (module) {
            if(module.modname.toLowerCase()!="forum"){
              return {
                id: missingId,
                name: module.name,
                url: module.url, 
              };
            }
           
          }
        }
        // return { id: missingId, name: "Unknown", url: "Unknown URL" };
      });

      return missingData;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to fetch Moodle user data");
    }
  }


}
module.exports = new Moodle2();
