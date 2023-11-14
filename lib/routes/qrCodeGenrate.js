const qrCodeService = require('../service/qrCodeGenrate');
const Joi = require("joi");

module.exports = [
  {
      method: 'POST',
      path: '/post/qrcode',
      options: {
        description: 'Get QRCode Image',
        notes: 'Returns QRCode Image',
        tags: ['api'],
        validate:{
          payload: Joi.object({
            data: Joi.string().required(),
            size: Joi.number().default(5),
            eccLevel: Joi.string().default("L"),
        }),
    },
  },
    handler: async (request, h) => {
      try {
       
        const { data, size, eccLevel } = request.payload;
        if (!data) {
          return h.response({ error: 'Data is required' }).code(400);
        }

        const result = await qrCodeService.generateQRCode(data, size, eccLevel);
      

        // Send the image data as the response
        const response = h.response(result).code(200);
        // response.type('image/png'); // Set the response content type to PNG image

        return response.type("Image/png");
      } catch (error) {
       
        return h.response({ error: 'Internal Server Error' }).code(500);
      }
    },
  },
];