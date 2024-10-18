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

// Function to upload the file to Zoho Creator
async function uploadFile(reportName, recordId, fieldLinkName, filePath) {
  try {
    let fileStream;

    // Check if the file path is a local file path
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      // Download the file first if it's a URL
      const response = await axios({
        url: filePath,
        method: "GET",
        responseType: "stream",
      });

      const filename = path.basename(filePath);
      const downloadPath = path.resolve(__dirname, "downloads", filename);
      console.log("Downloading file to:", downloadPath);

      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(downloadPath);
        response.data.pipe(writer);
        writer.on("finish", () => resolve(downloadPath));
        writer.on("error", reject);
      });

      fileStream = fs.createReadStream(downloadPath);
    } else {
      // Read the file directly if it's a local file path
      fileStream = fs.createReadStream(filePath);
    }

    // Prepare the Zoho Creator upload API URL
    const apiUrl = `https://creator.zoho.in/api/v2.1/navgurukul/ghar/report/${reportName}/${recordId}/${fieldLinkName}/upload`;
    const token = await refreshToken(); // Make sure you have a valid Zoho OAuth token
    const headers = {
      Authorization: `Zoho-oauthtoken ${token}`,
      environment: "development",
      demo_user_name: "kajalzoho@navguruku.org",
      Accept: "application/json",
    };

    // Prepare the form data to upload
    const formData = new FormData();
    formData.append("file", fileStream);

    // Send the upload request to Zoho Creator
    const response = await axios.post(apiUrl, formData, { headers });

    if (response.data.code !== 3000) {
      throw new Error(`Upload failed: ${response.data.message}`);
    }

    return response.data; // Return the Zoho Creator upload response
  } catch (error) {
    console.error("Error uploading file:", error);
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
