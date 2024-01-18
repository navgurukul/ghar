const Services = require('../service/moodle_api');
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
                        const { userId } = request.query;
                        const data = await Services.GradesbyCourseContent(userId,courseId);
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


    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    
];
