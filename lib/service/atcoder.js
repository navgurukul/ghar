const axios = require('axios');
const cheerio = require('cheerio');

const url = 'https://atcoder.jp';

async function fetchLatestContestName() {
  try {
    const response = await axios.get(url);
    // console.log("this is response",response);
    const $ = cheerio.load(response.data);
    const latestContest = $('#contest-table-recent tbody tr:first-child td:nth-child(2) a').text().trim();
    return latestContest;
  } catch (error) {
    console.error('Error fetching latest contest:', error.message || error);
    return null;
  }
}

async function fetchRating(user) {
  try {

    const ratingURL = `https://atcoder.jp/users/${user}`;
    const response = await axios.get(ratingURL);
    const $ = cheerio.load(response.data);
    const rating = $('#main-container > div:first-of-type > div:nth-of-type(3) > table > tbody > tr:nth-of-type(2) > td > span:first-of-type').text().trim();
    return rating;
  } catch (error) {
    console.error('Error fetching rating:', error.message || error);
    return null;
  }
}

module.exports = {
  fetchLatestContestName,
  fetchRating,
};
