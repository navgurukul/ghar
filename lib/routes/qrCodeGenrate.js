const qrCodeService = require('../service/qrCodeGenrate');
const Joi = require('joi');
const verifyService = require("../service/gharUser")
const Boom = require("@hapi/boom");


module.exports = [
  {
    method: 'GET',
    path: '/get/qrcode',
    options: {
      description: 'Get QRCode Image',
      notes: 'Returns QRCode Image',
      tags: ['api'],
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
        query: Joi.object({
          data: Joi.string().required(),
          size: Joi.number().default(5),
          eccLevel: Joi.string().default('L'),
        }),
      },
    },
    handler: async (request, h) => {
      try {
        const { data, size, eccLevel } = request.query;
        if (!data) {
          console.log('Data is required'); // Log the error in console
          return h.response({ error: 'Data is required' }).code(400);
        }

        const result = await qrCodeService.generateQRCode(data, size, eccLevel);
        console.log('QR Code generated:', result); // Log the generated QR code URL

        // Respond with the image URL
        return h.response(result).type("image/png");
      } catch (error) {
        console.error('Internal Server Error:', error); // Log any internal server errors
        return h.response({ error: 'Internal Server Error' }).code(500);
      }
    },
  },
];
