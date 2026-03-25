const readTheoryService = require('../service/readTheory');
const Joi = require("joi");
const verifyService = require("../service/gharUser")
const Boom = require("@hapi/boom");

module.exports = [
  {
    method: "POST",
    path: "/ReadTheory-studentData",
    options: {
      description: "retrieve student data from ReadTheory",
      tags: ["api"],
      pre: [
        {
          assign: "auth",
          method: async (request, h) => {
            const tokenHeader =
              request.headers.authorization || request.headers.Authorization;
            if (!tokenHeader) {
              // If no Authorization header is present, return an unauthorized error
              return Boom.unauthorized("No token provided");
            }
            let token;
            if (tokenHeader.startsWith("Bearer ")) {
              token = tokenHeader.split(" ")[1]; // Extract the token part of the header
            } else {
              token = tokenHeader; // Assume the entire header is the token
            }

            // Verify the token using the verifyToken service
            const isValid = await verifyService.verifyToken({ token: token });
            if (!isValid) {
              // If the token is invalid, return an unauthorized error
              return Boom.unauthorized("Invalid token");
            }
            // Proceed to the route handler if the token is valid
            return true;
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
        const { studentIds, delay } = request.payload;
    
        // Split the studentIds string into an array and filter invalid IDs
        const studentIdsArray = studentIds.split(',').map(id => id.trim());
        const invalidIds = studentIdsArray.filter(id => isNaN(parseInt(id, 10)));
        const validStudentIds = studentIdsArray.filter(id => !isNaN(parseInt(id, 10))).map(id => parseInt(id, 10));
    
        // Prepare the response object
        const response = {};
    
        // Fetch login details
        const loginDetails = await readTheoryService.login();
        if (loginDetails.error) {
          // If login failed, return the error message
          return h.response({ error: loginDetails.error }).code(401);
        }
    
        const { token, cookie } = loginDetails;
    
        // Fetch student data using the service method for valid IDs
        if (validStudentIds.length > 0) {
          const studentData = await readTheoryService.fetchStudentData(validStudentIds, delay);
    
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
        // Return a generic error message if something goes wrong
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    }
    
  },
];