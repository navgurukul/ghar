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

async function downloadFile(url) {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  // Determine the file extension from the URL or content type
  const contentDisposition = response.headers["content-disposition"];
  const filename = contentDisposition
    ? contentDisposition.split("filename=")[1].replace(/"/g, "")
    : path.basename(url);

  const downloadPath = path.resolve(__dirname, filename);

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(downloadPath);
    response.data.pipe(writer);
    writer.on("finish", () => resolve(downloadPath));
    writer.on("error", reject);
  });
}
// Upload file function
async function uploadFile(reportName, recordId, fieldLinkName, filePath) {
  try {
    // Step 1: Download the file
    const downloadPath = await downloadFile(filePath);

    const apiUrl = `https://creator.zoho.in/api/v2.1/navgurukul/ghar/report/${reportName}/${recordId}/${fieldLinkName}/upload`;
    const token = await refreshToken();
    const headers = {
      Authorization: `Zoho-oauthtoken ${token}`,
      environment: "development",
      demo_user_name: "kajalzoho@navguruku.org",
      Accept: "application/json",
      "Content-Type": "multipart/form-data",
    };

    // Step 2: Prepare form data for file upload with dynamic filename
    const formData = new FormData();
    formData.append(
      "file",
      fs.createReadStream(downloadPath),
      path.basename(downloadPath)
    );

    // Step 3: Send file upload request
    const response = await axios.post(apiUrl, formData, { headers });
    return response.data;
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
