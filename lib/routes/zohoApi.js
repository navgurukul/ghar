const Services = require('../service/zohoApi');

module.exports = [
    {
        method: 'GET',
        path: '/get/zoho/campus/data',
        options: {
            description: 'Get zoho campus data',
            notes: 'Returns a message',
            tags: ['api'],
        },
        handler: async (request, h) => {
            try {
                const data = await Services.campusData();
                return h.response(data);
            } catch (err) {
                return h.response({ error: err.message }).code(500)
            }
        },
    }
]