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
          delay: Joi.number().required().description("Delay between requests in milliseconds"),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { studentIds, delay } = request.payload;
        
        // Split the studentIds string into an array of IDs
        const studentIdsData = studentIds.split(',').map(id => parseInt(id.trim(), 10));

        // Fetch student data
        const studentData = await readTheoryService.fetchStudentData(studentIdsData, delay);

        return h.response(studentData).code(200);
      } catch (error) {
        console.error("Error fetching student data:", error.message);
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },
];
