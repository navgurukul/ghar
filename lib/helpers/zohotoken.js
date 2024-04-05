const axios = require("axios");
const config = require("../config");

let cachedToken = {
  value: null,
  expiry: null,
};
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

async function zohoData(reportName, params) {
  const token = await refreshToken();
  const apiUrl =
    "https://creator.zoho.in/api/v2.1/navgurukul/ghar/report/" + reportName;
  const headers = {
    Authorization: `Zoho-oauthtoken ${token}`,
    Accept: "application/json",
    demo_user_name: "kajalzoho@navgurukul.org",
    Accept: "application/json",
  };
  try {
    // console.log("params", params);
    // If params is not provided, pass an empty object
    const response = await axios.get(apiUrl, { headers, params: params || {} });
    // console.log("response..........", response.data);
    return response.data;
  } catch (error) {
    return error;
  }
}

async function zohoDataForCopyOf(reportName, params) {
  const token = await refreshToken();
  const apiUrl =
    "https://creator.zoho.in/api/v2.1/navgurukul/copy-of-ghar-nov14-2023/report/" +
    reportName;
  const headers = {
    Authorization: `Zoho-oauthtoken ${token}`,
    environment: "development",
    demo_user_name: "kajalzoho@navgurukul.org",
    Accept: "application/json",
  };
  try {
    // console.log("params", token);
    // If params is not provided, pass an empty object
    let response = await axios.get(apiUrl, { headers, params: params || {} });
    // Check for successful response status code (typically 200)
    if (response.status === 200) {
      // Data present in the report - return data and token
      return [response.data, token];
    } else {
      // No data present or error occurred - return an empty array and token
      return [[], token];
    }
    // return [response.data, token];
  } catch (error) {
    return [{}, token];
  }
}

async function getLearningPlatformData(reportName, isDev) {
  const token = await refreshToken();
  let apiUrl;
  let headers;

  if (isDev == true) {
    apiUrl =
      "https://creator.zoho.in/api/v2.1/navgurukul/ghar/report/" + reportName;
    headers = {
      Authorization: `Zoho-oauthtoken ${token}`,
      environment: "development",
      demo_user_name: "kajalzoho@navgurukul.org",
      Accept: "application/json",
    };
  } else {
    apiUrl =
      "https://creator.zoho.in/api/v2.1/navgurukul/ghar/report/" + reportName;
    headers = {
      Authorization: `Zoho-oauthtoken ${token}`,
      Accept: "application/json",
    };
  }
  try {
    const response = await axios.get(apiUrl, { headers });
    return response.data;
  } catch (error) {
    console.error(
      "Error in getLearningPlatformData:",
      "check the learning provider name in the report."
    );
    throw error;
  }
}

async function patchZohoDataForCopyOf(formName, data, isDev) {
  const token = await refreshToken();
  let apiUrl;
  let headers;

  if (isDev == true) {
    apiUrl =
      "https://creator.zoho.in/api/v2.1/navgurukul/ghar/form/" + formName;
    headers = {
      Authorization: `Zoho-oauthtoken ${token}`,
      environment: "development",
      demo_user_name: "kajalzoho@navgurukul.org",
      Accept: "application/json",
    };
  } else {
    apiUrl =
      "https://creator.zoho.in/api/v2.1/navgurukul/ghar/form/" + formName;
    headers = {
      Authorization: `Zoho-oauthtoken ${token}`,
      Accept: "application/json",
    };
  }
  // params = {
  //   process_until_limit: "true",
  // };

  try {
    const response = await axios.post(apiUrl, data, {
      headers,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  refreshToken,
  zohoData,
  zohoDataForCopyOf,
  patchZohoDataForCopyOf,
  getLearningPlatformData,
};
