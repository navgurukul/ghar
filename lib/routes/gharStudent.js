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
      validate: {
        query: Joi.object({
          Student_ng_email: Joi.string().email().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { Student_ng_email } = request.query;
        // const data = await Services.zohoData();
        const response = await Services.getStudentsByEmail(Student_ng_email);
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
    },
    handler: async (request, h) => {
      try {
        const response = await Services.getCampuses();
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
      validate: {
        query: Joi.object({
          campus: Joi.string().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { campus } = request.query;
        const response = await Services.getSchoolsBasedOnCampus(campus);
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
      validate: {
        query: Joi.object({
          recordId: Joi.string().required(),
        }),
        payload: Joi.object({
          updateData: Joi.object().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { recordId } = request.query;
        const { updateData } = request.payload;
        const response = await Services.updateGrFrmGrStd(recordId, updateData);
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
      validate: {
        payload: Joi.object({
          insertData: Joi.object().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { insertData } = request.payload;
        const response = await Services.insertGrFrmGrStd(insertData);
        return h.response(response);
      } catch (err) {
        return h.response({ error: err.message }).code(500);
      }
    },
  },
];
