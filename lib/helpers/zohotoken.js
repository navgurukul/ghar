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

async function zohoDataSTudent(reportName, params) {
  const token = await refreshToken();
  const apiUrl =
    "https://creator.zoho.in/api/v2.1/navgurukul/ghar/report/" + reportName;
  const headers = {
    Authorization: `Zoho-oauthtoken ${token}`,
    environment: "development",
    demo_user_name: "kajalzoho@navgurukul.org",
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

async function uploadFileToZohoCreator(filePath) {
  try {
    const token = await refreshToken();
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    const uploadResponse = await axios.post(
      "https://creator.zoho.in/api/v2/ghar/fileupload", // Update with your correct URL
      formData,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          ...formData.getHeaders(),
        },
      }
    );

    if (uploadResponse.data.code !== 3000) {
      throw new Error(`File Upload Error: ${uploadResponse.data.message}`);
    }

    return uploadResponse.data.data.file_url; // Assuming file_url is returned as the downloadable URL
  } catch (error) {
    console.error("Error uploading file to Zoho:", error);
    throw error;
  }
}

// Upload file function for local file
async function uploadFile(reportName, recordId, fieldLinkName, filePath) {
  try {
    // Ensure filePath is a valid local path
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const apiUrl = `https://creator.zoho.in/api/v2.1/navgurukul/ghar/report/${reportName}/${recordId}/${fieldLinkName}/upload`;
    const token = await refreshToken(); // Assuming this function retrieves a valid token

    // Prepare form data for file upload
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    // Generate the correct headers for form-data
    const headers = {
      Authorization: `Zoho-oauthtoken ${token}`,
      environment: "development",
      demo_user_name: "kajalzoho@navguruku.org",
      Accept: "application/json",
      ...formData.getHeaders(), // Add the correct form-data headers
    };

    // Send file upload request
    const response = await axios.post(apiUrl, formData, { headers });
    if (response.data.code !== 3000) {
      throw new Error(`File Upload Error: ${response.data.message}`);
    }

    return response.data; // Assuming this contains file URL or other data
  } catch (error) {
    console.error("Error uploading file:", error.message);
    throw error;
  }
}

async function updateGhrStd(reportName, updateData, recordId) {
  const token = await refreshToken();
  const apiUrl = `https://creator.zoho.in/api/v2.1/navgurukul/ghar/report/${reportName}/${recordId}`;
  const headers = {
    Authorization: `Zoho-oauthtoken ${token}`,
    environment: "development",
    demo_user_name: "kajalzoho@navguruku.org",
    Accept: "application/json",
  };
  try {
    const response = await axios.patch(apiUrl, updateData, { headers });
    return response.data;
  } catch (error) {
    console.error("Error updating report:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

async function insertGhrStd(formName, insertData) {
  try {
    const token = await refreshToken();
    const apiUrl = `https://creator.zoho.in/api/v2.1/navgurukul/ghar/form/${formName}`;
    const headers = {
      Authorization: `Zoho-oauthtoken ${token}`,
      environment: "development",
      demo_user_name: "kajalzoho@navguruku.org",
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    const response = await axios.post(apiUrl, insertData, { headers });

    if (response.data.code !== 3000) {
      throw new Error(`API Error: ${response.data.result[0].error}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error inserting student data:", error);
    throw error; // Re-throw the error to be handled by the caller
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
  uploadFile,
};
