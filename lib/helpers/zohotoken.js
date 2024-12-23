const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const config = require("../config");

let cachedToken = {
  value: null,
  expiry: null,
};

async function callHeaders(token, isDev) {
  try {
    let headers;
    if (isDev == false) {
      headers = {
        Authorization: `Zoho-oauthtoken ${token}`,
        environment: "development",
        demo_user_name: "ujjwal@navgurukul.org",
        Accept: "application/json",
      };
    } else {
      headers = {
        Authorization: `Zoho-oauthtoken ${token}`,
        Accept: "application/json",
      };
    }
    return headers;
  } catch (err) {
    return err.message;
  }
}

async function refreshToken() {
  // Check if the current token is still valid
  if (cachedToken.value && cachedToken.expiry > Date.now()) {
    return cachedToken.value;
  }

  const apiUrl = "https://accounts.zoho.in/oauth/v2/token";
  const refresh_token = config.zohoTokes.refresh_token;
  const client_id = config.zohoTokes.client_id;
  const client_secret = config.zohoTokes.client_secret;
  const grant_type = "refresh_token";

  try {
    const response = await axios.post(apiUrl, null, {
      params: {
        refresh_token,
        client_id,
        client_secret,
        grant_type,
      },
    });

    const newToken = response.data.access_token;
    // Set the new token and expiry time (1 hour from now)
    cachedToken = {
      value: newToken,
      expiry: Date.now() + 3000000, // 1 hour in milliseconds
    };

    return newToken;
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error;
  }
}

async function zohoDataSTudent(reportName, params, isDev) {
  // Get a new token if the current one has expired
  const token = await refreshToken();
  const apiUrl =
    "https://creator.zoho.in/api/v2.1/navgurukul/ghar/report/" + reportName;
  if (isDev == false) {
    headers = {
      Authorization: `Zoho-oauthtoken ${token}`,
      environment: "development",
      demo_user_name: "kajalzoho@navguruku.org",
      Accept: "application/json",
    };
  } else {
    headers = {
      Authorization: `Zoho-oauthtoken ${token}`,
      Accept: "application/json",
    };
  }
  try {
    // If params is not provided, pass an empty object
    const response = await axios.get(apiUrl, { headers, params: params || {} });
    return response.data;
  } catch (error) {
    return error;
  }
}

async function updateGhrStd(reportName, updateData, recordId, isDev) {
  // Get a new token if the current one has expired
  const token = await refreshToken();
  const apiUrl = `https://creator.zoho.in/api/v2.1/navgurukul/ghar/report/${reportName}/${recordId}`;
  if (isDev == false) {
    headers = {
      Authorization: `Zoho-oauthtoken ${token}`,
      environment: "development",
      demo_user_name: "kajalzoho@navguruku.org",
      Accept: "application/json",
    };
  } else {
    headers = {
      Authorization: `Zoho-oauthtoken ${token}`,
      Accept: "application/json",
    };
  }
  let response;
  try {
    // Make the API call to update the data
    response = await axios.patch(apiUrl, updateData, { headers });
    if (response.data.code != 3000) {
      throw new Error(`API Error: ${response.data.error}`);
    }
    return response.data;
  } catch (error) {
    console.error("Error inserting student data:", response.data.error);
    return { error: response.data.error };
  }
}

async function insertGhrStd(formName, insertData, isDev) {
  let response;
  try {
    // Get a new token if the current one has expired
    const token = await refreshToken();
    // Define the API URL based on the form name
    const apiUrl = `https://creator.zoho.in/api/v2.1/navgurukul/ghar/form/${formName}`;
    let headers;
    if (isDev == false) {
      headers = {
        Authorization: `Zoho-oauthtoken ${token}`,
        environment: "development",
        demo_user_name: "kajalzoho@navguruku.org",
        Accept: "application/json",
      };
    } else {
      headers = {
        Authorization: `Zoho-oauthtoken ${token}`,
        Accept: "application/json",
      };
    }
    // Make the API call to insert the data
    response = await axios.post(apiUrl, insertData, { headers });
    if (response.data.result[0].code != 3000) {
      throw new Error(`API Error: ${response.data.result[0].error}`);
    }

    return response.data;
  } catch (error) {
    console.error(
      "Error inserting student data:",
      response.data.result[0].error
    );
    return { error: response.data.result[0].error }; // Re-throw the error to be handled by the caller
  }
}

async function zohoData(reportName, params) {
  const token = await refreshToken();
  const apiUrl =
    "https://creator.zoho.in/api/v2.1/navgurukul/ghar/report/" + reportName;
  const headers = {
    Authorization: `Zoho-oauthtoken ${token}`,
    Accept: "application/json",
  };
  try {
    // If params is not provided, pass an empty object
    const response = await axios.get(apiUrl, { headers, params: params || {} });
    return response.data;
  } catch (error) {
    return error;
  }
}

module.exports = {
  refreshToken,
  zohoData,
  callHeaders,
  zohoDataSTudent,
  updateGhrStd,
  insertGhrStd,
};
