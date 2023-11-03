const Services = require('../service/moodle');

module.exports = [
    {
        method: 'GET',
        path: '/get/moodle/data',
        options: {
            description: 'Get Moodle data with Moodle API',
            notes: 'Returns a message',
            tags: ['api'],
        },
        handler: async (request) => {
            try {
                const data = await Services.moodle();
                return data;
            } catch (err) {
                return err;
            }
        },
    }
];
