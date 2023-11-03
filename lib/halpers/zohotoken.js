const axios = require('axios');
const config = require('../config') 

async function refreshToken() {
    const apiUrl = 'https://accounts.zoho.in/oauth/v2/token';
    const refresh_token = config.zohoTokes.refresh_token;
    const client_id = config.zohoTokes.client_id;
    const client_secret = config.zohoTokes.client_secret;
    const grant_type = 'refresh_token';

    try {
        const response = await axios.post(apiUrl, null, {
          params: {
            refresh_token,
            client_id,
            client_secret,
            grant_type,
          },
        });

        const data = response.data.access_token;
        return data;
        
      } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;
      }
    }

module.exports = refreshToken;