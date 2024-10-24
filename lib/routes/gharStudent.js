const Services = require("../service/gharStudent");
const Joi = require("joi");
const verifyService = require("../service/gharUser");
const Boom = require("@hapi/boom");

module.exports = [
  {
    method: "GET",
    path: "/gharZoho/students/By/NgEmail",
    options: {
      description: "Get zoho campus data",
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
          isDev: Joi.bool().required(),
          Student_ng_email: Joi.string().email().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { isDev, Student_ng_email } = request.query;
        // calling the getStudentsByEmail function from the service
        const response = await Services.getStudentsByEmail(
          Student_ng_email,
          isDev
        );
        return h.response(response);
      } catch (err) {
        return h.response({ error: err.message }).code(500);
      }
    },
  },
  {
    method: "GET",
    path: "/gharZoho/campuses",
    options: {
      description: "Get zoho campus data",
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
          isDev: Joi.bool().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { isDev } = request.query;
        // calling the getCampuses function from the service
        const response = await Services.getCampuses(isDev);
        return h.response(response);
      } catch (err) {
        return h.response({ error: err.message }).code(500);
      }
    },
  },
  {
    method: "GET",
    path: "/gharZoho/basedOn/campus/schools",
    options: {
      description: "Get zoho campus data",
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
          isDev: Joi.bool().required(),
          campus: Joi.string().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { isDev, campus } = request.query;
        // calling the getSchoolsBasedOnCampus function from the service
        const response = await Services.getSchoolsBasedOnCampus(campus, isDev);
        return h.response(response);
      } catch (err) {
        return h.response({ error: err.message }).code(500);
      }
    },
  },
  {
    method: "PATCH",
    path: "/ghar/update/students/detail",
    options: {
      description: "Update Ghar Student Details",
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
          isDev: Joi.bool().required(),
          recordId: Joi.string().required(),
        }),
        payload: Joi.object({
          updateData: Joi.object().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { recordId, isDev } = request.query;
        const { updateData } = request.payload;
        // calling the updateGrFrmGrStd function from the service
        const response = await Services.updateGrFrmGrStd(
          recordId,
          updateData,
          isDev
        );
        return h.response(response);
      } catch (err) {
        return h.response({ error: err.message }).code(500);
      }
    },
  },
  {
    method: "POST",
    path: "/ghar/insert/students",
    options: {
      description: "Insert Ghar Student Details",
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
          isDev: Joi.bool().required(),
        }),
        payload: Joi.object({
          insertData: Joi.object().required(),
        }),
      },
    },
    handler: async (request, h) => {
      let response;
      try {
        const { isDev } = request.query;
        const { insertData } = request.payload;
        // calling the insertGrFrmGrStd function from the service
        response = await Services.insertGrFrmGrStd(insertData, isDev);
        return h.response(response);
      } catch (err) {
        console.log(err)
        if(response.output){
          return h.response({ error: response.output.payload.message }).code(response.output.statusCode);
        }
        return h.response({ error: err.message }).code(500);
      }
    },
  },
];
