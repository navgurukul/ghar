const axios = require('axios');
const cheerio = require('cheerio');


async function getLatestContestName(contestType) {
    const apiUrl = 'https://kenkoooo.com/atcoder/resources/contests.json';

    try {
        // Fetch the list of AtCoder contests
        const response = await axios.get(apiUrl);

        if (response.status === 200) {
            const contests = response.data;

            // Filter contests based on the provided type
            const filteredContests = contests.filter(contest => contest.id.startsWith(contestType));

            if (filteredContests.length > 0) {
                // Sort contests by start time and return the latest one
                const sortedContests = filteredContests.sort((a, b) => b.start_epoch_second - a.start_epoch_second);
                const latestContest = sortedContests[0];
                return latestContest;
            } else {
                return null;
            }
        } else {
            throw new Error(`Failed to fetch contests. Status code: ${response.status}`);
        }
    } catch (error) {
        console.error(error.message);
        return null;
    }
}

async function loginAndGetSession(username, password) {
    try {
        // Fetch the AtCoder login page to obtain CSRF token
        const loginPageResponse = await axios.get('https://atcoder.jp/login');
        const $ = cheerio.load(loginPageResponse.data);
        const csrfToken = $('input[name=csrf_token]').val();

        // Perform login with provided credentials
        const loginResponse = await axios.post(
            'https://atcoder.jp/login',
            `csrf_token=${encodeURIComponent(csrfToken)}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': loginPageResponse.headers['set-cookie'].join(';'),
                },
                maxRedirects: 0,
                validateStatus: status => status >= 200 && status < 303,
            }
        );

        // Validate login response and obtain session cookies
        if (loginResponse.status !== 302 || !loginResponse.headers.location || !loginResponse.headers['set-cookie']) {
            throw new Error('Login failed. Check your credentials.');
        }

        const sessionCookies = loginResponse.headers['set-cookie'];
        return { cookies: sessionCookies };
    } catch (error) {
        console.error('Error during login:', error.message || error);
        throw error;
    }
}

async function getJSONData(url, session) {
    try {
        // Fetch JSON data using session cookies
        const response = await axios.get(url, {
            headers: {
                'Cookie': session.cookies.join(';'),
            },
        });

        const jsonData = response.data;
        return jsonData;
    } catch (error) {
        console.error('Error fetching JSON data:', error.message || error);
        throw error;
    }
}

async function getUserRating(username, jsonData) {
    try {
        // Find the user in the standings data(Rating) based on the provided username
        const user = jsonData.StandingsData.find(user => user.UserScreenName === username);

        if (user) {
            // Return the user's rating if found
            return user.Rating;
            
        } else {
            throw new Error(` ${username} not found in this contest.`);
        }
    } catch (error) {
        return ('Please check your credentials:', error.message || error)
    }
}

async function userParticipatedContests(username) {
    const apiUrl = `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${username}&from_second=1685622984`;

    try {
        const response = await axios.get(apiUrl);

        if (response.status === 200) {
            // Extract only the contest_id values from the user submissions array
            const userSubmissions = response.data;
            const contestIds = userSubmissions.map(submission => submission.contest_id);

            // Sort the contest IDs in ascending order and remove duplicates
            const uniqueSortedContestIds = [...new Set(contestIds)].sort().reverse();
           
            return uniqueSortedContestIds;
        } else {
            throw new Error(`Failed to fetch user submissions. Status code: ${response.status}`);
        }
    } catch (error) {
        console.error('Error fetching user submissions:', error.message || error);
        throw error;
    }
}

module.exports = {
    getLatestContestName,
    loginAndGetSession,
    getJSONData,
    getUserRating,
    userParticipatedContests,
};
