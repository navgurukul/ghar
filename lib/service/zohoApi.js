const axios = require('axios');
const _ = require('lodash');
const refreshToken = require('../halpers/zohotoken') 

class ZohoData{
    async campusData(){
        const token = await refreshToken();
        const apiUrl = `https://creator.zoho.in/api/v2.1/navgurukul/ghar/report/Approve_Leaves`;
        const headers = {
            Authorization: `Zoho-oauthtoken ${token}`,
            environment: 'development',
            demo_user_name: 'kajalzoho@navgurukul.org',
            Accept: 'application/json',
          };
        try {
        const response = await axios.get(apiUrl, { headers });

        // Handle the response data as needed
        const data = response.data;    
        return data
        } 
        catch (error) {
            console.error('Error fetching data:', error);
        }
    }
}

module.exports = new ZohoData();


