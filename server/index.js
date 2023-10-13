const Hapi = require('@hapi/hapi');

const swaggerPlugin = require('./swagger');

const routes = require('../lib/routes');

const init = async () => {
    const server = Hapi.server({
        port: 3050,
        host: 'localhost',
    });

    await server.register([
        swaggerPlugin]);

    server.route(routes);

    await server.start();
    console.log('Server running on %s', server.info.uri);

};

init();

