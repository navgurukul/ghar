const Services = require('../service/moodle');
const Joi = require('joi');
const verifyService = require("../service/gharUser")
const Boom = require("@hapi/boom");


module.exports = [

    {
      method: 'POST',
      path: '/moodle/getAllCategoryAndTheirCoursesWhereUserEnrolled',
      options: {
        description: 'give all category and their courses where user enrolled', 
        notes: 'give courses field and names of category where user enrolled',
        tags: ['api'],
        pre: [
          {
            assign: "auth",
            method: async (request, h) => {
              const tokenHeader =
                request.headers.authorization || request.headers.Authorization;
              console.log(tokenHeader, "tokenHeader");
              if (!tokenHeader) {
                console.log("No Authorization header present");
                return Boom.unauthorized("No token provided");
              }
              let token;
              if (tokenHeader.startsWith("Bearer ")) {
                token = tokenHeader.split(" ")[1]; // Extract the token part of the header
              } else {
                token = tokenHeader; // Assume the entire header is the token
              }
              console.log(token, "Extracted Token");
  
              // The rest of your existing code for token verification remains the same
              const isValid = await verifyService.verifyToken({token:token}); // Assuming verifyToken is an async function and returns true if valid
              if (!isValid) {
                // Use Boom to return an unauthorized error
                return Boom.unauthorized("Invalid token");
              }
              return true; // Proceed to the route handler if the token is valid
            },
          },
        ],
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
        pre: [
          {
            assign: "auth",
            method: async (request, h) => {
              const tokenHeader =
                request.headers.authorization || request.headers.Authorization;
              console.log(tokenHeader, "tokenHeader");
              if (!tokenHeader) {
                console.log("No Authorization header present");
                return Boom.unauthorized("No token provided");
              }
              let token;
              if (tokenHeader.startsWith("Bearer ")) {
                token = tokenHeader.split(" ")[1]; // Extract the token part of the header
              } else {
                token = tokenHeader; // Assume the entire header is the token
              }
              console.log(token, "Extracted Token");
  
              // The rest of your existing code for token verification remains the same
              const isValid = await verifyService.verifyToken({token:token}); // Assuming verifyToken is an async function and returns true if valid
              if (!isValid) {
                // Use Boom to return an unauthorized error
                return Boom.unauthorized("Invalid token");
              }
              return true; // Proceed to the route handler if the token is valid
            },
          },
        ],
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
        pre: [
          {
            assign: "auth",
            method: async (request, h) => {
              const tokenHeader =
                request.headers.authorization || request.headers.Authorization;
              console.log(tokenHeader, "tokenHeader");
              if (!tokenHeader) {
                console.log("No Authorization header present");
                return Boom.unauthorized("No token provided");
              }
              let token;
              if (tokenHeader.startsWith("Bearer ")) {
                token = tokenHeader.split(" ")[1]; // Extract the token part of the header
              } else {
                token = tokenHeader; // Assume the entire header is the token
              }
              console.log(token, "Extracted Token");
  
              // The rest of your existing code for token verification remains the same
              const isValid = await verifyService.verifyToken({token:token}); // Assuming verifyToken is an async function and returns true if valid
              if (!isValid) {
                // Use Boom to return an unauthorized error
                return Boom.unauthorized("Invalid token");
              }
              return true; // Proceed to the route handler if the token is valid
            },
          },
        ],
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
        pre: [
          {
            assign: "auth",
            method: async (request, h) => {
              const tokenHeader =
                request.headers.authorization || request.headers.Authorization;
              console.log(tokenHeader, "tokenHeader");
              if (!tokenHeader) {
                console.log("No Authorization header present");
                return Boom.unauthorized("No token provided");
              }
              let token;
              if (tokenHeader.startsWith("Bearer ")) {
                token = tokenHeader.split(" ")[1]; // Extract the token part of the header
              } else {
                token = tokenHeader; // Assume the entire header is the token
              }
              console.log(token, "Extracted Token");
  
              // The rest of your existing code for token verification remains the same
              const isValid = await verifyService.verifyToken({token:token}); // Assuming verifyToken is an async function and returns true if valid
              if (!isValid) {
                // Use Boom to return an unauthorized error
                return Boom.unauthorized("Invalid token");
              }
              return true; // Proceed to the route handler if the token is valid
            },
          },
        ],
        validate: {
          payload: Joi.object({
            email:Joi.string().required(),
            courseId:Joi.number().required(),
            checkProdOrDev:Joi.bool().required(),
          }),
        }
      },
      handler: async (request, h) => {
        try {
          const emailArray = request.payload.email.split(',');
          const { email,courseId,checkProdOrDev } = request.payload;
          const data = await Services.progressTrack(emailArray,courseId,checkProdOrDev); 
          return h.response(data);  // Using h.response to ensure proper response handling
        } catch (err) {
          console.error(err);
          return h.response({ error: 'Internal Server Error' }).code(500);
        }
      },
    },

    {
      method: 'POST',
      path: '/moodle/missingActivitySettings',
      options: {
        description: 'missingActivitySettings', 
        notes: 'missingActivitySettings',
        tags: ['api'],
        pre: [
          {
            assign: "auth",
            method: async (request, h) => {
              const tokenHeader =
                request.headers.authorization || request.headers.Authorization;
              console.log(tokenHeader, "tokenHeader");
              if (!tokenHeader) {
                console.log("No Authorization header present");
                return Boom.unauthorized("No token provided");
              }
              let token;
              if (tokenHeader.startsWith("Bearer ")) {
                token = tokenHeader.split(" ")[1]; // Extract the token part of the header
              } else {
                token = tokenHeader; // Assume the entire header is the token
              }
              console.log(token, "Extracted Token");
  
              // The rest of your existing code for token verification remains the same
              const isValid = await verifyService.verifyToken({token:token}); // Assuming verifyToken is an async function and returns true if valid
              if (!isValid) {
                // Use Boom to return an unauthorized error
                return Boom.unauthorized("Invalid token");
              }
              return true; // Proceed to the route handler if the token is valid
            },
          },
        ],
        validate: {
          payload: Joi.object({
            email:Joi.string().required(),
            courseId:Joi.number().required(),
            checkProdOrDev:Joi.bool().required(),

          }),
         
        }
      },
      handler: async (request, h) => {
        try {
          const emailArray = request.payload.email.split(',');
          const { email,courseId,checkProdOrDev} = request.payload;
          const data = await Services.missingActivitiesSettings(emailArray,courseId,checkProdOrDev,); 
          return h.response(data);  // Using h.response to ensure proper response handling
        } catch (err) {
          console.error(err);
          return h.response({ error: 'Internal Server Error' }).code(500);
        }
      },
    },
    
];
