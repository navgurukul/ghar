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

// every user will scrape at once
async function getScrapeData(usernames) {
  // Ensure usernames is an array
  if (!Array.isArray(usernames)) {
    usernames = [usernames];
  }

  // Fetch HTML for all users in parallel
  const htmls = await Promise.all(usernames.map(fetchHTML));

  // Flatten the array of arrays
  return [].concat(...htmls.map((html, i) => {
    if (!html) {
      console.error("HTML content not found for user:", usernames[i]);
      return [];
    }

    const $ = cheerio.load(html);

    // Scraping the table rows and extracting desired data
    const scrapedData = [];
    $("#history tbody tr").each((index, element) => {
      const date = $(element).find("td:nth-child(1)").text().trim();
      const contest = $(element).find("td:nth-child(2)").text().trim();
      const contestId = getContestId(contest); // Get contest ID
      const rating = $(element).find("td:nth-child(5)").text().trim();
      const name = usernames[i];
      // Pushing data into an array
      scrapedData.push({ date, contest, contestId, name, rating });
    });

    return scrapedData;
  }));
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
async function fetchWithRetry(url, options, retries = 3) {
  try {
    return await axios(url, options);
  } catch (error) {
    if (retries > 0 && error.code === "ECONNRESET") {
      // console.log(`Retrying request (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

async function fetchAtcoderContest(contestId, usernames, delay) {
  try {
    const getCookies = await loginAndGetSession();
    const standingUrl = `https://atcoder.jp/contests/${contestId}/standings/json`;
    const response = await fetchWithRetry(standingUrl, {
      headers: {
        Cookie: getCookies.cookies.join(";"),
      },
    });

    const dataInfo = response.data;
    const standingsDataMap = new Map(
      dataInfo.StandingsData.map((user) => [user.UserName, user])
    );

    const usersData = await Promise.all(
      usernames.map(async (username, index) => {
        return new Promise((resolve) => {
          setTimeout(async () => {
            const userInfo = standingsDataMap.get(username);
            if (userInfo) {
              const [historyData, score] = await Promise.all([
                getScrapeData(username),
                scrapeTasksAndScores(contestId),
              ]);
              const filterData = historyData.filter(
                (ele) => ele.contestId == contestId
              );
              const totalScoreTrimmed = Math.floor(
                userInfo.TotalResult ? userInfo.TotalResult.Score / 100 : null
              );

              if (filterData.length > 0) {
                resolve({
                  [username]: {
                    UserScreenName: userInfo.UserScreenName,
                    Rank: userInfo.Rank,
                    TotalAccepted: userInfo.TotalResult
                      ? userInfo.TotalResult.Accepted
                      : null,
                    TotalScore: totalScoreTrimmed,
                    Current_Rating: userInfo.Rating,
                    Rating: filterData[0].rating,
                    IsRated: userInfo.IsRated,
                    "Contest Type": userInfo.IsRated ? "Competition" : "Practice",
                    contestId: filterData[0].contestId,
                    contestName: filterData[0].contest,
                    Date: filterData[0].date,
                    max_score: score.sumOfScores,
                  },
                });
              } 
            } else {
              resolve({
                [username]: null,
              });
            }
          }, index * delay); // delay of 1 second between each request
        });
      })
    );
    return usersData;
  } catch (error) {
    console.log("Error in fetching data from API:", error.message);
    throw error;
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
  upcomingContestsIds
};
