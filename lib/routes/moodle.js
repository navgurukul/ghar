const Services = require('../service/moodle');
const Joi = require('joi');


module.exports = [
    {
        method: 'GET',
        path: '/get/moodle/data',
        options: {
            description: 'Get Moodle data with Moodle API',
            notes: 'Returns a message',
            tags: ['api'],
        },
        handler: async (request) => {
            try {
                const data = await Services.moodle();
                return data;
            } catch (err) {
                return err;
            }
        },
    },

    //carring grades from moodle
    {
        method: 'GET',
        path: '/moodle/StudentgradesByCourses/{courseId}',
        options: {
          description: 'Get Moodle data with Moodle API',
          notes: 'Returns student grades for a given course',
          tags: ['api'],
          validate: {
            params: Joi.object({
              courseId: Joi.string()
            }),
            query: Joi.object({
              page: Joi.number().default(1),
              pageSize: Joi.number().default(10),
            }),
          },
        },
        handler: async (request, h) => {
          try {
            const { courseId } = request.params;
            const { page, pageSize } = request.query;
      
            const data = await Services.studentGrades(courseId, page, pageSize);
            console.log(data, '42 routes');
      
            return h.response(data);  // Using h.response to ensure proper response handling
          } catch (err) {
            console.error(err);
            return h.response({ error: 'Internal Server Error' }).code(500);
          }
        },
      }


    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    
];
