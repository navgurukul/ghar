const readTheoryService = require('../service/readTheory');
const Joi = require("joi");

module.exports = [
  {
    method: "POST",
    path: "/ReadTheory-studentData/post",
    options: {
      description: "Post Student Data",
      tags: ["api"],
      validate: {
        payload: Joi.object({
          studentIds: Joi.string().required().description("Comma-separated string of student IDs"),
          delay: Joi.number().required().default(500),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { studentIds,delay } = request.payload;

        // Split the studentIds string into an array and filter invalid IDs
        const studentIdsArray = studentIds.split(',').map(id => id.trim());
        const invalidIds = studentIdsArray.filter(id => isNaN(parseInt(id, 10)));
        const validStudentIds = studentIdsArray.filter(id => !isNaN(parseInt(id, 10))).map(id => parseInt(id, 10));

        // Prepare the response object
        const response = {};

        // Fetch student data using the service method for valid IDs
        if (validStudentIds.length > 0) {
          const studentData = await readTheoryService.fetchStudentData(validStudentIds,delay);

          // Populate response object with valid student data
          studentData.forEach(data => {
            const studentId = Object.keys(data)[0]; // Extract student ID
            response[studentId] = data[studentId]; // Assign student data directly
          });
        }

        // Add null values for invalid IDs
        invalidIds.forEach(id => {
          response[id] = null;
        });

        return h.response(response).code(200);
      } catch (error) {
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },
];