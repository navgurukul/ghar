const { Client, GatewayIntentBits, Partials } = require("discord.js");
const cron = require("node-cron");
const { google } = require("googleapis");
const User = require("../models/discord");
const config = require("../config");



////Send the Google Form////
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

// Store users who have already been sent a DM
const usersNotified = new Set();

// Function to send a DM to all users in the guild
const sendDailyDM = async (guild) => {
  try {
    await guild.members.fetch();
    guild.members.cache.forEach((member) => {
      if (!member.user.bot && !usersNotified.has(member.id)) {
        member.user
          .send("Hi! Please fill out this form: https://forms.gle/33aH1fkiDp1mR5sz7")
          .then(() => {
            console.log(`Sent DM to ${member.user.tag}`);
            usersNotified.add(member.id);
          })
          .catch((error) => {
            console.error(`Could not send DM to ${member.user.tag}:`, error);
          });
      }
    });
  } catch (error) {
    console.error("Error fetching members or sending DMs:", error);
  }
};

// Schedule the task to run once a day at a specific time 
cron.schedule("0 10 * * *", () => {
  console.log("Sending daily DMs...");
  client.guilds.cache.forEach((guild) => {
    sendDailyDM(guild);
  });
});


// Listen for a specific command to manually trigger the function
// client.on("messageCreate", (message) => {
//   if (message.author.bot) return; 
//   // Check if the message is "!senddm"
//   if (message.content === "!senddm") {
//     console.log("Manually triggering DMs...");
//     client.guilds.cache.forEach((guild) => {
//       sendDailyDM(guild);
//     });
//     message.reply("DMs have been sent to all users!");
//   }
// });

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});
client.login(config.discordBotToken.bot_token);





//Fetch the Google Sheet data
const SHEET_ID = config.googleSheet.sheet_id;
const READ_RANGE = "Responses!B2:C";
const WRITE_RANGE = "D";


const postData = async () => {
  try {
    // Google Auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.googleSheet.client_email,
        private_key: config.googleSheet.private_key.replace(/\\n/g, '\n'),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    // Read data 
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: READ_RANGE,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { message: "No data found", data: [] };
    }

    // Format and store data
    const formattedData = rows.map((row) => ({
      email: row[0],
      discordId: row[1],
    }));

    for (const row of formattedData) {
      if (row.email && row.discordId) {
        await User.findOrCreate({
          where: { email: row.email },
          defaults: { discordId: row.discordId },
        });
      }
    }

    // Mark rows as "updated" in Google Sheet
    const updateRequests = rows.map((_, index) => ({
      range: `Responses!${WRITE_RANGE}${index + 2}`,
      values: [["updated"]],
    }));

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        data: updateRequests,
        valueInputOption: "USER_ENTERED",
      },
    });

    return { message: "Data stored successfully", data: formattedData };
  } catch (err) {
    console.error("Error in fetchDiscordID:", err.message);
    return { error: err.message };
  }
}


//get data
const getData = async () => {
  try {
    const data = await User.findAll({
      order: [["id", "ASC"]],
    });
    return { message: "Data fetched successfully", data };
  } catch (err) {
    console.error("Error fetching data:", err.message);
    return { error: err.message };
  }
}

module.exports = { postData, getData, sendDailyDM, client };
