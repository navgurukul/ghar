const Services = require("../service/zohoApi");
const Joi = require("joi");
const verifyService = require("../service/gharUser");
const Boom = require("@hapi/boom");

module.exports = [
  {
    method: "GET",
    path: "/get/zoho/students",
    options: {
      description: "Get zoho Student data",
      notes: "Returns a message",
      tags: ["api"],
      pre: [
        {
          assign: "auth",
          method: async (request, h) => {
            const tokenHeader =
              request.headers.authorization || request.headers.Authorization;
            if (!tokenHeader) {
              return Boom.unauthorized("No token provided");
            }
            let token;
            if (tokenHeader.startsWith("Bearer")) {
              token = tokenHeader.split(" ")[1]; // Extract the token part of the header
            } else {
              token = tokenHeader; // Assume the entire header is the token
            }

            // The rest of your existing code for token verification remains the same
            const isValid = await verifyService.verifyToken({ token: token }); // Assuming verifyToken is an async function and returns true if valid
            if (!isValid) {
              // Use Boom to return an unauthorized error
              return Boom.unauthorized("Invalid token");
            }
            return true; // Proceed to the route handler if the token is valid
          },
        },
      ],
      validate: {
        query: Joi.object({
          min_value: Joi.number().required(),
          max_value: Joi.number().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { min_value, max_value } = request.query;
        // const data = await Services.zohoData();
        const response = await Services.getStudents(min_value, max_value);
        return h.response(response);
      } catch (err) {
        return h.response({ error: err.message }).code(500);
      }
    },
  },
   {
    method: "GET",
    path: "/gharZoho/students/filter",
    options: {
      description: "Get students with optional filters (campus, school, status)",
      notes: "Returns students based on optional filters. If no filters provided, returns all students. Filters can be combined.",
      tags: ["api"],
      pre: [
        {
          assign: "auth",
          method: async (request, h) => {
            const tokenHeader =
              request.headers.authorization || request.headers.Authorization;
            if (!tokenHeader) {
              return Boom.unauthorized("No token provided");
            }
            let token;
            if (tokenHeader.startsWith("Bearer ")) {
              token = tokenHeader.split(" ")[1]; // Extract the token part of the header
            } else {
              token = tokenHeader; // Assume the entire header is the token
            }

            // The rest of your existing code for token verification remains the same
            const isValid = await verifyService.verifyToken({ token: token }); // Assuming verifyToken is an async function and returns true if valid
            if (!isValid) {
              // Use Boom to return an unauthorized error
              return Boom.unauthorized("Invalid token");
            }
            return true; // Proceed to the route handler if the token is valid
          },
        },
      ],
      validate: {
        query: Joi.object({
          stdIdStart: Joi.number().optional().required(),
          stdIdEnd: Joi.number().optional().required(),
          isDev: Joi.bool().required(),
          campus: Joi.string().optional(),
          school: Joi.string().optional(),
          status: Joi.string().optional(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { isDev, campus, school, status, stdIdStart, stdIdEnd } = request.query;
        
        // Build filters object with only provided values
        const filters = {};
        if (campus) filters.campus = campus;
        if (school) filters.school = school;
        if (status) filters.status = status;
        if (stdIdStart) filters.idStart = stdIdStart;
        if (stdIdEnd) filters.idEnd = stdIdEnd;
        
        // calling the getFilteredStudents function from the service
        const response = await Services.getFilteredStudents(filters, isDev);
        return h.response(response);
      } catch (err) {
        return h.response({ error: err.message }).code(500);
      }
    },
  }
];
