const { WebClient } = require('@slack/web-api');
const config = require("../config");

const getUserNames = async () => {
  try {
    // Retrieve Slack token from the configuration
    const tokenValue = config.slackToken.token;

    // Create a new WebClient instance using the token
    const client = new WebClient(tokenValue);

    // Fetch the list of users from Slack
    const result = await client.users.list();

    // Filter out bots and extract relevant user information
    const users = result.members.reduce((usersStore, user) => {
      if (!user.is_bot) {
        usersStore.push({ id: user.id, name: user.name, real_name: user.real_name });
      }
      return usersStore;
    }, []);

    return users; // Return the extracted user information
  } catch (error) {
    throw new Error('Failed to fetch user data');
  }
};

module.exports = { getUserNames };
