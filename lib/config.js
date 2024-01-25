const dotenv = require('dotenv');
dotenv.config(); // Load environment variables from .env

module.exports = {
    zohoTokes:{
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    },
    Moodle:{
        token:process.env.MOODLE_TOKEN
    },
    slackToken:{
        token:process.env.SLACK_TOKEN
    },
    Atcoder:{
        login_user:process.env.USER_NAME,
        login_psw:process.env.NG_PASSWORD
    }
}