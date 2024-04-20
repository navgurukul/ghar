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
    const rating = $(element).find("td:nth-child(5)").text().trim();
    const name = username;
    // Pushing data into an array
    scrapedData.push({ date, contest, contestId, name, rating });
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
    /*const getCookies = await loginAndGetSession();
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
      const totalScoreTrimmed = Math.floor(userInfo.TotalResult ? userInfo.TotalResult.Score / 100 : null);

      const UserData = {
        [username]: {
          UserScreenName: userInfo.UserScreenName,
          Rank: userInfo.Rank,
          TotalAccepted: userInfo.TotalResult
            ? userInfo.TotalResult.Accepted
            : null,
          TotalScore:totalScoreTrimmed ,
          Current_Rating: userInfo.Rating,
          Rating: filterData[0].rating,
          IsRated: userInfo.IsRated,
          "Contest Type": userInfo.IsRated ? "Competition" : "Practice",
          contestId: filterData[0].contestId,
          contestName: filterData[0].contest,
          Date: filterData[0].date,
          max_score: score.sumOfScores,
        },
      };*/
    let UserData1 = {
        "shivaniMeena": {
          "UserScreenName": "shivaniMeena",
          "Rank": 9581,
          "TotalAccepted": 0,
          "TotalScore": 0,
          "Current_Rating": 148,
          "Rating": "165",
          "IsRated": true,
          "Contest Type": "Competition",
          "contestId": "abc348",
          "contestName": "Toyota Programming Contest 2024#4（AtCoder Beginner Contest 348）",
          "Date": "2024-04-06 22:40:00+0900",
          "max_score": 2650
        }
    };
    return UserData1;
    // } else {
    //   const UserData1 = {
    //     [username]: null,
    //   };
    //   return UserData1;
    // }
  } catch (error) {
    console.log("Error in fetching data from API:", error.message);
    throw error; // Rethrow the error to handle it in the calling code
  }
}

async function upcomingContestsIds() {
  try {
    const url = "https://atcoder.jp/contests/";
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const contests = [];
    const contestTable = $("#contest-table-upcoming tbody");

    contestTable.children().each((index, element) => {
      const contestRow = $(element);
      const dateCell = contestRow.find("td:nth-child(1) a time");
      const nameCell = contestRow.find("td:nth-child(2) a");
      const nameText = nameCell.text().trim();

      if (dateCell && nameCell) {
        const contestDate = dateCell.text().trim();
        const contestId = nameCell.attr("href").split("/")[2]; // Extract contest ID from href attribute
        const contestName = nameCell
          .contents()
          .filter((_, node) => node.nodeType === 3)
          .text()
          .trim(); // Extract contest name without markup

        if (contestName.includes("AtCoder Beginner Contest")) {
          contests.push({
            date: contestDate,
            name: contestName,
            id: contestId,
          });
        }
      }
    });

    return contests; // Return the upcoming ABC contests array
  } catch (error) {
    console.error(error);
    throw error; // Rethrow the error to handle it in the calling code
  }
}

module.exports = {
  fetchAtcoderContest,
  upcomingContestsIds,
};
