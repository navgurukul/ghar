const dotenv = require("dotenv");
dotenv.config(); // Load environment variables from .env

module.exports = {
  auth:{
    secret_key: process.env.SECRET_KEY
  },
  zohoTokes: {
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
  },
  Moodle: {
    token: process.env.MOODLE_TOKEN,
    ip_address: process.env.MOODLE_IP,
    tokenDev: process.env.DEV_MOODLE_TOKEN,
    ip_addressDev: process.env.DEV_MOODLE_IP,
  },
  slackToken: {
    token: process.env.SLACK_TOKEN,
  },
  Atcoder: {
    login_user: process.env.USER_NAME,
    login_psw: process.env.NG_PASSWORD,
  },
  ReadTheory: {
    read_theory_teacher: process.env.READ_THEORY__NG_OWNER,
    read_theory_psw: process.env.RT_PASSWORD,
  },
  googleSheet: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
  },
  zohoReports:{
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>   DEV AND PROD REPORTS URL   >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>   
        
    devCategoryReport:"https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/report/moodleCategory_Report",
    devCourseReport:"https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/report/All_Moodle_Courses",
    devTopicReport:"https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/report/moodleTopic_Report",
    devActivityReport:"https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/report/moodleActivity_Report",

    categoryReport:"https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/report/moodleCategory_Report",
    courseReport:"https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/report/All_Moodle_Courses",
    topicReport:"https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/report/moodleTopic_Report",
    activityReport:"https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/report/moodleActivity_Report",
  },
  zohoForms:{
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>   DEV AND PROD FORMS URL   >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>   
        
    devCategoryForm: "https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/form/moodleCategory",
    devCourseForm: "https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/form/Moodle_Courses",
    devTopicForm:"https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/form/moodleTopic",
    devActivityForm:"https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/form/MoodleActivities",

    categoryForm: "https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/form/moodleCategory",
    courseForm: "https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/form/Moodle_Courses",
    topicForm:"https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/form/moodleTopic",
    activityForm:"https://creator.zoho.in/api/v2.1/navgurukul/moodle-cog-feb-23-2024/form/MoodleActivities",
  }
};
