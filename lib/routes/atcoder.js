// const Joi = require('joi');
const service = require('../service/atcoder');

module.exports = [
  {
    method: 'GET',
    path: '/get/latestContest',
    handler: async (request, h) => {
      try {
        console.log("hello atcoder")
        const latestContest = await service.fetchLatestContestName();
        console.log(latestContest);
        return { latestContest };
      } catch (error) {
        console.error('Error fetching latest contest:', error.message || error);
        return { error: 'Internal Server Error' };
      }
    },
  },
  {
    method: 'GET',
    path: '/get/rating',
    handler: async (request, h) => {
      const { username } = request.query;
      console.log(username);
      try {
        // console.log("welcome")
        const userRating = await service.fetchRating(username);
        return { username, userRating };
      } catch (error) {
        console.error('Error fetching user rating:', error.message || error);
        return { error: 'Internal Server Error' };
      }
    },
  },
];