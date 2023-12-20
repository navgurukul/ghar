const { getUserNames } = require('../service/slackUser');

module.exports = [
  {
    method: 'GET',
    path: '/get/slack/users',
    options: {
      description: 'Get Slack Users',
      tags: ['api'],
    },
    handler: async (request, h) => {
      try {
        const users = await getUserNames();
        if (users.error) {
          return h.response({ error: users.error }).code(500);
        }
        return { users };
      } catch (error) {
    
        return h.response({ error: 'Failed to fetch user data' }).code(500);
      }
    },
  },
];
