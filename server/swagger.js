const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const Package = require('../package.json');

const swaggerPlugin = {
    name: 'app-swagger',
    async register(server) {
        await server.register([
            Inert,
            Vision,
            {
                plugin: HapiSwagger,
                options: {
                    info: {
                        title: 'zoho API',
                        version: Package.version,
                    },
                    schemes: ['http', 'https'],
                },
            },
        ]);
    },
};

// ghar_node_server

module.exports = swaggerPlugin;
