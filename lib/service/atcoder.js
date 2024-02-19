const axios = require("axios");
const cheerio = require("cheerio");
const config = require("../config");

// Function to fetch the AtCoder login page and obtain session cookies
async function loginAndGetSession() {
  try {
    // Fetch the AtCoder login page to obtain CSRF token
    const loginPageResponse = await axios.get("https://atcoder.jp/login");
    const $ = cheerio.load(loginPageResponse.data);
    const csrfToken = $("input[name=csrf_token]").val();

    // Perform login with provided credentials
    const loginResponse = await axios.post(
      "https://atcoder.jp/login",
      `csrf_token=${encodeURIComponent(
        csrfToken
      )}&username=${encodeURIComponent(
        config.Atcoder.login_user
      )}&password=${encodeURIComponent(config.Atcoder.login_psw)}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: Array.isArray(loginPageResponse.headers["set-cookie"])
            ? loginPageResponse.headers["set-cookie"].join(";")
            : loginPageResponse.headers["set-cookie"],
        },
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 303,
      }
    );

    // Validate login response and obtain session cookies
    if (
      loginResponse.status !== 302 ||
      !loginResponse.headers.location ||
      !loginResponse.headers["set-cookie"]
    ) {
      throw new Error("Login failed. Check your credentials.");
    }

    const sessionCookies = loginResponse.headers["set-cookie"];
    return { cookies: sessionCookies };
  } catch (error) {
    console.error("Error during login:", error.message || error);
    throw error;
  }
}

async function getJSONData(url, session) {
  try {
    // Fetch JSON data using session cookies
    const response = await axios.get(url, {
      headers: {
        Cookie: session.cookies.join(";"),
      },
    });

    const jsonData = response.data;
    return jsonData;
  } catch (error) {
    console.error("Error fetching JSON data:", error.message || error);
    throw error;
  }
}

// Function to fetch the HTML content based on the provided username
async function fetchHTML(username) {
  try {
    const url = `https://atcoder.jp/users/${username}/history`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching the HTML:", error);
  }
}

function getContestId(contestName) {
  const parts = contestName.split(" ");
  const lastPart = parts[parts.length - 1];
  getContestId;
  let contestType = "";

  if (contestName.includes("Beginner")) {
    contestType = "abc";
  } else if (contestName.includes("Regular")) {
    contestType = "arc";
  } else if (contestName.includes("Heuristic")) {
    contestType = "ahc";
  } else if (contestName.includes("Grand")) {
    contestType = "agc";
  }

  const contestId = lastPart.replace(/\D/g, ""); // Extract only digits
  return contestType + contestId;
}

// Function to scrape specific data
async function getScrapeData(username) {
  const html = await fetchHTML(username);
  if (!html) {
    console.error("HTML content not found!");
    return;
  }
  const $ = cheerio.load(html);

  // Scraping the table rows and extracting desired data
  const scrapedData = [];
  $("#history tbody tr").each((index, element) => {
    const date = $(element).find("td:nth-child(1)").text().trim();
    const contest = $(element).find("td:nth-child(2)").text().trim();
    const contestId = getContestId(contest); // Get contest ID
    const name = username;
    // Pushing data into an array
    scrapedData.push({ date, contest, contestId, name });
  });
  // Log or return the scraped data
  //   console.log(scrapedData, "hello");
  return scrapedData;
}

async function scrapeTasksAndScores(contestId) {
  try {
    const url = `https://atcoder.jp/contests/${contestId}`;
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const table = $("table.table");
    const tasks = {};
    let sumOfScores = 0;

    $("tbody > tr", table).each((index, element) => {
      const task = $(element).find("td:nth-child(1)").text().trim();
      const score = $(element).find("td:nth-child(2)").text().trim();
      if (/^[A-Za-z]$/.test(task) && !tasks[task]) {
        tasks[task] = score;
        sumOfScores += Number(score);
      }
    });
    return { sumOfScores }; // Return both tasks and the sum
  } catch (error) {
    throw new Error("Error occurred while scraping:", error);
  }
}

async function fetchAtcoderContest(contestId, username) {
  try {
    // console.log("samiksha...145", contestId, username);
    const getCookies = await loginAndGetSession();
    // console.log(cookies,"cookies")
    const standingUrl = `https://atcoder.jp/contests/${contestId}/standings/json`;
    const response = await axios.get(standingUrl, {
      headers: {
        Cookie: getCookies.cookies.join(";"),
      },
    });

    const dataInfo = response.data;
    // console.log(dataInfo, "dataInfo");
    const userInfo = dataInfo.StandingsData.find(
      (userData) => userData.UserName === username
    );

    if (userInfo) {
      const historyData = await getScrapeData(username);
      const filterData = historyData.filter(
        (ele) => ele.contestId == contestId
      );
      const score = await scrapeTasksAndScores(contestId);

      const UserData = {
        [username]: {
          UserScreenName: userInfo.UserScreenName,
          Rank: userInfo.Rank,
          TotalAccepted: userInfo.TotalResult
            ? userInfo.TotalResult.Accepted
            : null,
          TotalScore: userInfo.TotalResult ? userInfo.TotalResult.Score : null,
          Rating: userInfo.Rating,
          IsRated: userInfo.IsRated,
          "Contest Type": userInfo.IsRated ? "Competition" : "Practice",
          contestId: filterData[0].contestId,
          contestName: filterData[0].contest,
          Date: filterData[0].date,
          max_score: score.sumOfScores,
        },
      };

      // console.log(UserData);
      return UserData;
    } else {
      const UserData = {
        [username]: "User not found in this contest",
      };
      // console.log(UserData);
      return UserData;
    }
  } catch (error) {
    console.log("Error in fetching data from API:", error.message);
    throw error; // Rethrow the error to handle it in the calling code
  }
}

async function userParticipatedContests(username) {
  const apiUrl = `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${username}&from_second=1685622984`;

  try {
    const response = await axios.get(apiUrl);

    if (response.status === 200) {
      // Extract only the contest_id values from the user submissions array
      const userSubmissions = response.data;
      const contestIds = userSubmissions.map(
        (submission) => submission.contest_id
      );

      // Sort the contest IDs in ascending order and remove duplicates
      const uniqueSortedContestIds = [...new Set(contestIds)].sort().reverse();

      return uniqueSortedContestIds;
    } else {
      throw new Error(
        `Failed to fetch user submissions. Status code: ${response.status}`
      );
    }
  } catch (error) {
    console.error("Error fetching user submissions:", error.message || error);
    throw error;
  }
}

module.exports = {
  loginAndGetSession,
  getJSONData,
  fetchAtcoderContest,
  userParticipatedContests,
};
