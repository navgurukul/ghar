const Services = require('../service/index');

module.exports = [
    {
        method: 'GET',
        path: '/hello',
        options: {
            description: 'Say Hello',
            notes: 'Returns a message',
            tags: ['api'],
        },
        handler: async (request) => {
            try{
                const data = await Services.try();
                return data;
            }
            catch(err){
                return err;
            }
        },
    }
]