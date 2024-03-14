const Services = require('../service/moodle');
const Joi = require('joi');


module.exports = [
    {
        method: 'GET',
        path: '/moodle/Courses',
        options: {
          description: 'Get Moodle data with Moodle API',
          notes: 'Returns student grades for a given course',
          tags: ['api'],
        },
        handler: async (request, h) => {
          try {
            const data = await Services.moodle(); // Corrected the function call
            return h.response(data);  // Using h.response to ensure proper response handling
          } catch (err) {
            console.error(err);
            return h.response({ error: 'Internal Server Error' }).code(500);
          }
        },
      },
    {
        method: 'GET',
        path: '/moodle/EnrolledUsers',
        options: {
          description: 'Get Moodle data with Moodle API',
          notes: 'Returns student grades for a given course',
          tags: ['api'],
        },
        handler: async (request, h) => {
          try {
            const data = await Services.getUsersDetails(); 
            return h.response(data);  // Using h.response to ensure proper response handling
          } catch (err) {
            console.error(err);
            return h.response({ error: 'Internal Server Error' }).code(500);
          }
        },
      },
      
        {
            method: 'GET',
            path: '/moodle/StudentGradesdata/data/{courseId}',
            options: {
                    description: 'Get Moodle data with Moodle API',
                    notes: 'Returns a message',
                    tags: ['api'],
                validate: {
                    params: Joi.object({
                        courseId: Joi.string()
                    }),
                    query: Joi.object({
                      userid:Joi.number().default(79),
                    }),
                },
            },
            handler: async (request, h) => {
                try {
                        const { courseId } = request.params;
                        const { userid } = request.query;
                        const data = await Services.GradesbyCourseContent(userid,courseId);
                        // Assuming Services.courseContents returns null for missing courseId
                        if (!data) {
                                return h.response({ error: 'CourseId not found' }).code(404);
                        }
                        return h.response(data);
                    }
                catch (err) {
                        return err;
        }},   
    },

    {
      method: 'GET',
      path: '/moodle/getAllCategoryAndTheirCoursesWhereUserEnrolled',
      options: {
        description: 'give all category and their courses where user enrolled', 
        notes: 'give courses field and names of category where user enrolled',
        tags: ['api'],
        validate: {
          query: Joi.object({
            email:Joi.string().required(),
          }),
        }
      },
      handler: async (request, h) => {
        try {
          const { email } = request.query;
          const data = await Services.categoryAndCourses(email); 
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
      method: 'GET',
      path: '/moodle/getTopicsAndActivities',
      options: {
        description: 'get topics and activities of a course', 
        notes: 'get topics and activities of a course',
        tags: ['api'],
        validate: {
          query: Joi.object({
            email:Joi.string().required(),
            courseId:Joi.number().required(),
          }),
        }
      },
      handler: async (request, h) => {
        try {
          const { email,courseId } = request.query;
          const data = await Services.topicAndActivities(email,courseId); 
          return h.response(data);  // Using h.response to ensure proper response handling
        } catch (err) {
          console.error(err);
          return h.response({ error: 'Internal Server Error' }).code(500);
        }
      },
    },


    // progress track of a user
    {
      method: 'GET',
      path: '/moodle/studentProgress',
      options: {
        description: 'progress track of a user', 
        notes: 'progress track of a user',
        tags: ['api'],
        validate: {
          query: Joi.object({
            email:Joi.string().required(),
            courseId:Joi.number().required(),
          }),
        }
      },
      handler: async (request, h) => {
        try {
          const { email,courseId } = request.query;
          const data = await Services.progressTrack(email,courseId); 
          return h.response(data);  // Using h.response to ensure proper response handling
        } catch (err) {
          console.error(err);
          return h.response({ error: 'Internal Server Error' }).code(500);
        }
      },
    },
    
];
