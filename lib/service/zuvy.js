const axios = require('axios');
const config = require('../config');

class ZuvyProgress {
    constructor() {
        this.cache = new Map();
    }

    async ZuvyProgress(BootCampId, Emails) {
        const cacheKey = `bootcamp_${BootCampId}`;
        if (this.cache.has(cacheKey)) {
            console.log('Returning cached data');
            return this.cache.get(cacheKey);
        }

        try {
            const jwtToken = config.ZuvyAPIsJWT.token; // Replace with your actual JWT token
            const response = await axios.get(`https://dev.api.zuvy.org/admin/leaderBoard/bootcampId${BootCampId}`, {
                headers: {
                    'Authorization': `Bearer ${jwtToken}`
                }
            });

            const transformedData = {};
            if (response.data && Array.isArray(response.data)) {
                response.data.forEach(bootcamp => {
                    if (bootcamp.students) {
                        bootcamp.students.forEach(student => {
                            const email = student.userInfo.email;
                            if (Emails.includes(email)) {
                                transformedData[email] = {
                                    attendance: student.attendance,
                                    progress: student.progress,
                                    assessmentScore: student.assessmentScore,
                                };
                            }
                        });
                    }
                });
            } else {
                console.error('No valid data found in the response');
            }

            console.log('Transformed Data:', transformedData);
            this.cache.set(cacheKey, transformedData); // Cache the transformed data
            return transformedData;
        } catch (error) {
            console.error(error);
            return error;
        }
    }
}

module.exports = new ZuvyProgress();