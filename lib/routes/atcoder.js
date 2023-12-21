const ContestService = require('../service/atcoder');
const config = require('../config');

module.exports = [
    {
        method: 'GET',
        path: '/get/atcoder-data',
        options: {
            description: 'Get AtCoder Data',
            tags:['api']
        },
        handler: async (request, h) => {
            try {
                // Extract contestType from request query parameters
                const { contestType } = request.query;

                // Validate that contestType is provided
                if (!contestType) {
                    return h.response({ error: 'Contest type not provided' }).code(400);
                }

                // Fetch the latest contest based on the provided contestType
                const latestContest = await ContestService.getLatestContestName(contestType);

                // Return an error if no contest is found for the provided type
                if (!latestContest) {
                    return h.response({ error: `No ${contestType} contests found` }).code(404);
                }

                // Construct the standings URL for the latest contest
                const standingsUrl = `https://atcoder.jp/contests/${latestContest.id}/standings/json`;

                // Log in to AtCoder and obtain a session
                const session = await ContestService.loginAndGetSession(config.Atcoder.login_user, config.Atcoder.login_psw);

                // Fetch JSON data for the standings
                const jsonData = await ContestService.getJSONData(standingsUrl, session);

                // Validate the structure of the fetched data
                if (!jsonData || !jsonData.StandingsData || !Array.isArray(jsonData.StandingsData)) {
                    throw new Error('Invalid data structure. Unable to extract required fields.');
                }

                // Map the relevant user data for response
                const usersData = jsonData.StandingsData;
                const atcoderUserData = usersData.map(user => ({
                    LastContest: latestContest.id,
                    UserScreenName: user.UserScreenName,
                    UserName: user.UserName,
                    Rank: user.Rank,
                    TotalAccepted: user.TotalResult ? user.TotalResult.Accepted : null,
                    TotalScore: user.TotalResult ? user.TotalResult.Score : null,
                    Rating: user.Rating,
                    IsRated: user.IsRated
                }));

                // Return the mapped data as the response
                return h.response(atcoderUserData);
            } catch (error) {
                // Handle errors and return an Internal Server Error response
                return h.response({ error: 'Internal Server Error' }).code(500);
            }
        },
    },
    {
        method: 'GET',
        path: '/get/atcoder-rating',
        options: {
            description: 'Get AtCoder Rating for a User',
            tags: ['api']
        },

        handler: async (request, h) => {
            try {
                // Extract username, password, and contestName from request query parameters
                const { username, password, contestName } = request.query;

                // Fetch the latest contest based on the provided contestName
                const latestContest = await ContestService.getLatestContestName(contestName);

                // Return an error if no contest is found for the provided contestName
                if (!latestContest) {
                    return h.response({ error: 'No contests found' }).code(404);
                }

                // Construct the standings URL for the latest contest
                const standingsUrl = `https://atcoder.jp/contests/${latestContest.id}/standings/json`;

                // Log in to AtCoder with the provided username and password
                const session = await ContestService.loginAndGetSession(username, password);

                // Fetch JSON data for the standings
                const jsonData = await ContestService.getJSONData(standingsUrl, session);
                
                // Validate the structure of the fetched data
                if (!jsonData || !jsonData.StandingsData || !Array.isArray(jsonData.StandingsData)) {
                    throw new Error('Invalid data structure. Unable to extract required fields.');
                }

                // Retrieve the user's rating from the fetched data
                const userRating = await ContestService.getUserRating(username, jsonData);

                // Return the username and userRating as the response
                return h.response({ username, userRating });
            } catch (error) {
                // Handle errors and return an Internal Server Error response
                return h.response({ error: 'Internal Server Error' }).code(500);
            }
        },
    },
];
