const Services = require("../service/gharStudent");
const Joi = require("joi");
const verifyService = require("../service/gharUser");
const Boom = require("@hapi/boom");
const { query } = require("express");

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
          isDev: Joi.bool().required(),
          Student_ng_email: Joi.string().email().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { isDev, Student_ng_email } = request.query;
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
      validate: {
        query: Joi.object({
          isDev: Joi.bool().required(),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { isDev } = request.query;
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
      try {
        const { isDev } = request.query;
        const { insertData } = request.payload;
        const response = await Services.insertGrFrmGrStd(insertData, isDev);
        return h.response(response);
      } catch (err) {
        return h.response({ error: err.message }).code(500);
      }
    },
  },
];
