const dotenv = require('dotenv');
dotenv.config(); // Load environment variables from .env

module.exports = {
    zohoTokes:{
        client_id: process.env.Zoho_client_id,
        client_secret: process.env.Zoho_client_secret,
        refresh_token: process.env.Zoho_refresh_token
    },
    Moodle:{
        token:process.env.Moodle_token
    }
}