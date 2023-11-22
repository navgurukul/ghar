const qrCodeService = require('../service/qrCodeGenrate');
const Joi = require('joi');

module.exports = [
  {
    method: 'GET',
    path: '/get/qrcode',
    options: {
      description: 'Get QRCode Image',
      notes: 'Returns QRCode Image',
      tags: ['api'],
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
