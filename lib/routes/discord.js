const Services = require("../service/discord");
const Boom = require('@hapi/boom'); // Make sure to have @hapi/boom installed for custom error handling

module.exports = [
    {
        method: "POST",
        path: "/discord/send-daily-dm",
        options: {
            description: "Send DM manually via API",
            notes: "Send DM manually via API",
            tags: ["api"],
        },
        handler: async (request, h) => {
            try {
                const guilds = Services.client.guilds.cache;
                for (const guild of guilds.values()) {
                    await Services.sendDailyDM(guild);
                }
                return h.response({ success: true, message: "DMs sent successfully." }).code(200);
            } catch (err) {
                console.error("Error sending DMs:", err.message);
                return h.response({ error: "Failed to send DMs", details: err.message }).code(500);
            }
        },
    },


    {
        method: "POST",
        path: "/discord/store-sheet-data",
        options: {
            description: "Store Sheet data into DB",
            notes: "Store Sheet data into DB",
            tags: ["api"],
        },
        handler: async (request, h) => {
            try {
                const result = await Services.postData();
                return h.response({ success: true, message: "Data stored", result }).code(200);
            } catch (err) {
                console.error("Error storing sheet data:", err.message);
                return h.response({ error: "Failed to store sheet data", details: err.message }).code(500);
            }
        }
    },
    

    {
        method: 'GET',
        path: '/discord/fetch-discordId',
        options: {
            description: 'Get data from PostgreSQL',
            notes: 'Get data from PostgreSQL',
            tags: ['api'],
        },
        handler: async (request, h) => {
            try {
                const result = await Services.getData();
                return h.response(result);
            } catch (err) {
                console.error(err);
                return h.response({ error: 'Internal Server Error' }).code(500);
            }
        },
    }

];
