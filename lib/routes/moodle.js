const Services = require('../service/moodle');
const Joi = require('joi');


module.exports = [


//   // ....................Zoho..Activity..Update............................
//   {
//     method: "GET",
//     path: "/moodle/activityRecordUpdateOnZoho",
//     options: {
//       description: "progress track of a user",
//       notes: "progress track of a user",
//       tags: ["api"],
//       validate: {
//         query: Joi.object({
//           email: Joi.string().required(),
//           systemId : Joi.string().required(),
//           courseId: Joi.string().required(),
//           checkProdOrDev: Joi.bool().required(),
          
//         }),
//       },
//     },
//     handler: async (request, h) => {
//       try {
//         const { email,systemId,courseId, checkProdOrDev} = request.query;
//         const data = await Services.activityRecordUpdateOnZoho(email,systemId,courseId, checkProdOrDev);
//         return h.response(data); // Using h.response to ensure proper response handling
//       } catch (err) {
//         // console.error(err);
//         return h.response({ error: "Internal Server Error" }).code(500);
//       }
//     },
//   },
// // ....................Zoho..Course..Update............................
//     {
//       method: "GET",
//       path: "/moodle/courseRecordUpdateOnZoho",
//       options: {
//         description: "progress track of a user",
//         notes: "progress track of a user",
//         tags: ["api"],
//         validate: {
//           query: Joi.object({
//             email: Joi.string().required(),
//             systemId : Joi.string().required(),
//             checkProdOrDev: Joi.bool().required(),
            
//           }),
//         },
//       },
//       handler: async (request, h) => {
//         try {
//           const { email,systemId, checkProdOrDev} = request.query;
//           const data = await Services.courseRecordUpdateOnZoho(email,systemId, checkProdOrDev);
//           return h.response(data); // Using h.response to ensure proper response handling
//         } catch (err) {
//           // console.error(err);
//           return h.response({ error: "Internal Server Error" }).code(500);
//         }
//       },
//     },
// // ....................Zoho..Topic..Update............................
//     {
//       method: "GET",
//       path: "/moodle/topicRecordUpdateOnZoho",
//       options: {
//         description: "progress track of a user",
//         notes: "progress track of a user",
//         tags: ["api"],
//         validate: {
//           query: Joi.object({
//             email: Joi.string().required(),
//             systemId : Joi.string().required(),
//             courseId: Joi.string().required(),
//             checkProdOrDev: Joi.bool().required(),
//           }),
//         },
//       },
//       handler: async (request, h) => {
//         try {
//           const { email,systemId, courseId,checkProdOrDev} = request.query;
//           const data = await Services.topicRecordUpdateOnZoho(email,systemId,courseId, checkProdOrDev);
//           return h.response(data); // Using h.response to ensure proper response handling
//         } catch (err) {
//           // console.error(err);
//           return h.response({ error: "Internal Server Error" }).code(500);
//         }
//       },
//     },

// // ....................Zoho..Category..Update............................
//   {
//     method: "GET",
//     path: "/moodle/categoryRecordUpdateOnZoho",
//     options: {
//       description: "progress track of a user",
//       notes: "progress track of a user",
//       tags: ["api"],
//       validate: {
//         query: Joi.object({
//           email: Joi.string().required(),
//           systemId : Joi.string().required(),
//           checkProdOrDev: Joi.bool().required(),
          
//         }),
//       },
//     },
//     handler: async (request, h) => {
//       try {
//         const { email,systemId, checkProdOrDev} = request.query;
//         const data = await Services.categoryRecordUpdateOnZoho(email,systemId, checkProdOrDev);
//         return h.response(data); // Using h.response to ensure proper response handling
//       } catch (err) {
//         // console.error(err);
//         return h.response({ error: "Internal Server Error" }).code(500);
//       }
//     },
//   },

 
    // {
    //   method: "GET",
    //   path: "/moodle/recordUpdateOnZoho",
    //   options: {
    //     description: "progress track of a user",
    //     notes: "progress track of a user",
    //     tags: ["api"],
    //     validate: {
    //       query: Joi.object({
    //         email: Joi.string().required(),
    //         systemId : Joi.string().required(),
    //         checkProdOrDev: Joi.bool().required(),
            
    //       }),
    //     },
    //   },
    //   handler: async (request, h) => {
    //     try {
    //       const { email,systemId, checkProdOrDev} = request.query;
    //       const data = await Services.moodleDataUpdateOnZoho(email,systemId, checkProdOrDev);
    //       return h.response(data); // Using h.response to ensure proper response handling
    //     } catch (err) {
    //       // console.error(err);
    //       return h.response({ error: "Internal Server Error" }).code(500);
    //     }
    //   },
    // },

    {
      method: 'POST',
      path: '/moodle/getAllCategoryAndTheirCoursesWhereUserEnrolled',
      options: {
        description: 'give all category and their courses where user enrolled', 
        notes: 'give courses field and names of category where user enrolled',
        tags: ['api'],
        validate: {
          // query: Joi.object({
          //   // email:Joi.array().required(),
            // checkProdOrDev:Joi.bool().required(),
          // }),
          payload: Joi.object({
            checkProdOrDev:Joi.bool().required(),
            email:Joi.string().required(),

          }),
         
        }
      },
      handler: async (request, h) => {
        try {
          // const { checkProdOrDev } = request.query;
          const emailArray = request.payload.email.split(',');
          const { email ,checkProdOrDev} = request.payload;
          const data = await Services.categoryAndCourses(emailArray,checkProdOrDev); 
          return h.response(data);  // Using h.response to ensure proper response handling
        } catch (err) {
          console.error(err);
          return h.response({ error: 'Internal Server Error' }).code(500);
        }
      },
    },

    {
      method: 'POST',
      path: '/moodle/getAllCoursesWhereUserEnrolled',
      options: {
        description: 'give all category and their courses where user enrolled', 
        notes: 'give courses field and names of category where user enrolled',
        tags: ['api'],
        validate: {
          // query: Joi.object({
          //   email:Joi.array().required(),
          //   checkProdOrDev:Joi.bool().required(),
          // }),
          payload: Joi.object({
            checkProdOrDev:Joi.bool().required(),
            email:Joi.string().required(),
          }),
        }
      },
      handler: async (request, h) => {
        try {
          // const {email, checkProdOrDev } = request.query;
          let emailArray = request.payload.email.split(',');
          const { email ,checkProdOrDev} = request.payload;
          const data = await Services.coursesInMoodleWhereUserEnrolled(emailArray,checkProdOrDev); 
          return h.response(data);  // Using h.response to ensure proper response handling
        } catch (err) {
          console.error(err);
          return h.response({ error: 'Internal Server Error' }).code(500);
        }
      },
    },



    {
      method: 'GET',
      path: '/moodle/coursesInsideCategory',
      options: {
        description: 'Get all courses inside a category', 
        notes: 'Returns all courses inside a category',
        tags: ['api'],
        validate: {
          query: Joi.object({
            categoryId:Joi.number().required(),
          }),
        }
      },
      handler: async (request, h) => {
        try {
          const { categoryId } = request.query;
          const data = await Services.allCoursesInCategoryWise(categoryId); 
          return h.response(data);  // Using h.response to ensure proper response handling
        } catch (err) {
          console.error(err);
          return h.response({ error: 'Internal Server Error' }).code(500);
        }
      },
    },
    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    {
      method: 'POST',
      path: '/moodle/getTopicsAndActivities',
      options: {
        description: 'get topics and activities of a course', 
        notes: 'get topics and activities of a course',
        tags: ['api'],
        validate: {
          payload: Joi.object({
            email:Joi.string().required(),
            courseId:Joi.number().required(),
            checkProdOrDev:Joi.bool().required(),
            topicId: Joi.string(),
          }), 
        }
      },
      handler: async (request, h) => {
        try {
          const emailArray = request.payload.email.split(',');
          const { email,courseId,topicId,checkProdOrDev } = request.payload;
          const data = await Services.topicAndActivities(emailArray,courseId,checkProdOrDev,topicId); 
          return h.response(data);  // Using h.response to ensure proper response handling
        } catch (err) {
          console.error(err);
          return h.response({ error: 'Internal Server Error' }).code(500);
        }
      },
    },


    // progress track of a user
    {
      method: 'POST',
      path: '/moodle/studentProgress',
      options: {
        description: 'progress track of a user', 
        notes: 'progress track of a user',
        tags: ['api'],
        validate: {
          payload: Joi.object({
            userName:Joi.string().required(),
            courseId:Joi.number().required(),
            checkProdOrDev:Joi.bool().required(),
          }),
        }
      },
      handler: async (request, h) => {
        try {
          const userArray = request.payload.userName.split(',');
          const { userName,courseId,checkProdOrDev } = request.payload;
          const data = await Services.progressTrack(userArray,courseId,checkProdOrDev); 
          return h.response(data);  // Using h.response to ensure proper response handling
        } catch (err) {
          console.error(err);
          return h.response({ error: 'Internal Server Error' }).code(500);
        }
      },
    },
    
];
