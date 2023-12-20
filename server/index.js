const Hapi = require('@hapi/hapi');
const swaggerPlugin = require('./swagger');
const fs = require('fs');
const path = require('path');
const requireAll = require('require-all');

const init = async () => {
    const server = Hapi.server({
        port: 3050,
        host: 'localhost',
    });

    await server.register([
        swaggerPlugin]);

        const routeModules = requireAll({
          dirname:path.join(__dirname + '/../lib/routes'), // Provide the absolute path to the 'lib/routes' directory
          filter: /(.+)\.js$/, // Filter to load only .js files
        });
        // Loop through the loaded modules and add them to the server
        for (const moduleName in routeModules) {
          if (routeModules.hasOwnProperty(moduleName)) {
            server.route(routeModules[moduleName]);
          }
        }

        await server.start();
        console.log('Server running on %s', server.info.uri);
    
};

init();

