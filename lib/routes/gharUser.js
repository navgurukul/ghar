const Services = require('../service/gharUser');
const Joi = require('joi');
const db = require('../database/db');


module.exports = [
{
    method: 'POST',
    path: '/authenticate/gharUsers',
    options: {
      description: 'ghar users',
      tags: ['api'],
      validate: {
        // Define any required query parameters here, if necessary
          payload: Joi.object({
            email:Joi.string().required(),
          }),
      }
    },
    handler: async (request, h) => {
      try {
        const data = await Services.gharUser(request.payload); 
        return h.response(data);
      } catch (err) {
        console.error(err);
        return h.response({ error: 'Internal Server Error' }).code(500);
      }
    },
  },

  {
    method: 'POST',
    path: '/authenticate/verifyToken',
    options: {
      description: 'ghar users',
      tags: ['api'],
      validate: {
        // Define any required query parameters here, if necessary
          payload: Joi.object({
            token:Joi.string().required(),
          }),
      }
    },
    handler: async (request, h) => {
      try {
        const data = await Services.verifyToken(request.payload); 
        return h.response(data);
      } catch (err) {
        console.error(err);
        return h.response({ error: 'Internal Server Error' }).code(500);
      }
    },
  },
]