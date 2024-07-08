const readTheoryService = require('../service/readTheory');
const Joi = require("joi");
const verifyService = require("../service/gharUser")
const Boom = require("@hapi/boom");

module.exports = [
  {
    method: "POST",
    path: "/ReadTheory-studentData/post",
    options: {
      description: "Post Student Data",
      tags: ["api"],
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