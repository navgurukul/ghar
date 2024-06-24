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
                    securityDefinitions: {
                        // Define a security scheme named "jwt"
                        jwt: {
                            type: 'apiKey',
                            name: 'Authorization',
                            in: 'header',
                            'x-keyPrefix': 'Bearer ' // Optional, if you want to prefix the token with "Bearer "
                        }
                    },
                    security: [{ jwt: [] }], // Apply the "jwt" security scheme globally
                },
            },
        ]);
    },
};
module.exports = swaggerPlugin;