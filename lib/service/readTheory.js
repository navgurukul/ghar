const axios = require("axios");
const config = require("../config");

class ReadTheoryService {
  // Fetch HTTP response with given URL and options
  async fetchHTTPResponse(url, options) {
    try {
      const response = await axios({ method: "post", url, ...options });
      return response;
    } catch (error) {
      throw new Error(`Error in fetchHTTPResponse: ${error.message}`);
    }
  }

  // Login to ReadTheory and return authentication details
  async login() {
    try {
      const response = await this.fetchHTTPResponse(
        "https://readtheory.org/auth/doLogin",
        {
          method: "post",
          data: {
            j_username: config.ReadTheory.read_theory_teacher,
            j_password: config.ReadTheory.read_theory_psw,
            ajaxLogin: "Log in",
          },
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 303,
        }
      );

      if (response.headers["set-cookie"]) {
        const cookie = response.headers["set-cookie"]
          .map((cookie) => cookie.split(";")[0])
          .join(";");

        const { teacherId, token } = await this.fetchTeacherIdAndToken(cookie);
        return { teacherId, token, cookie };
      } else {
        console.error("Login failed. No authentication cookie received.");
        return null;
      }
    } catch (error) {
      console.error("Error during login:", error.message);
      return null;
    }
  }

  // Extract teacher ID from HTML response
  async fetchTeacherId(response) {
    const html = response.data;
    const match = html.match(/"teacherId":\s*(\d+)/);
    return match && match[1] ? parseInt(match[1]).toString() : null;
  }

  // Extract authorization token from HTML response
  async fetchAuthorizationToken(response) {
    const html = response.data;
    const match = html.match(/"authorization":"([^"]+)"/);
    return match && match[1] ? match[1] : null;
  }

  // Fetch teacher ID and authorization token
  async fetchTeacherIdAndToken(cookie) {
    const studentsURL = "https://readtheory.org/app/student/list";

    try {
      const response = await this.fetchHTTPResponse(studentsURL, {
        method: "get",
        headers: { Cookie: cookie },
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 303,
      });

      const teacherId = await this.fetchTeacherId(response);
      const token = await this.fetchAuthorizationToken(response);

      return { teacherId, token };
    } catch (error) {
      throw new Error(
        `Error fetching Teacher ID and Authorization Token: ${error.message}`
      );
    }
  }

  async fetchStudentData(studentIds, delay) {
    const loginDetails = await this.login();
    if (!loginDetails) {
        console.error("Login failed. Unable to fetch student data.");
        return [];
    }

    const { token, cookie } = loginDetails;

    const promises = studentIds.map((studentId, index) =>
        new Promise(resolve =>
            setTimeout(async () => {
                try {
                    const singleStudentDataURL = `https://readtheory.org/dashboard/viewProfileForStudent?studentId=${studentId}&beginDateString=null&endDateString=null&jsonFormat=true`;

                    const dataHeaders = {
                        Cookie: cookie,
                        Authorization: "Bearer " + token,
                        Referer: `https://readtheory.org/app/teacher/reports/student/${studentId}`,
                        "x-requested-with": "XMLHttpRequest",
                    };

                    const response = await this.fetchHTTPResponse(singleStudentDataURL, {
                        method: "get",
                        headers: dataHeaders,
                        maxRedirects: 0,
                        validateStatus: (status) => status >= 200 && status < 303,
                    });

                    if (response && response.data && response.data.data && response.data.data.command) {
                        const index = response.data.data.command;
                        const studentData = {
                            studentId: index.studentId.toString(),
                            username: index.username,
                            fullName: index.firstName + " " + index.lastName,
                            email: index.email,
                            lastLoginDate: index.lastLoginDate ? index.lastLoginDate.split("T")[0] : "",
                            currentLevel: index.currentLevel,
                            initialLevel: index.initialLevel,
                            highestLevel: index.highestLevel,
                            initialLexileLevel: index.initialLexileLevel,
                            averageLexileLevel: index.averageLexileLevel,
                            averageQuizLevel: index.averageQuizLevel,
                            quizzesAboveInitialGradeLevel: index.quizzesAboveInitialGradeLevel,
                            quizzesBelowInitialGradeLevel: index.quizzesBelowInitialGradeLevel,
                            quizzesCompleted: index.quizzesCompleted,
                            quizzesPassed: index.quizzesPassed,
                            quizzesFailed: index.quizzesFailed,
                            pointsEarned: index.pointsEarned,
                            totalPoints: index.totalPoints,
                        };
                        resolve({ [studentId.toString()]: studentData });
                    } else {
                        console.error(`Empty or unexpected response for studentId ${studentId}`, response.data);
                        resolve({ [studentId.toString()]: null }); // Return null or default structure for invalid IDs
                    }
                } catch (error) {
                    // console.error(`Error in getStudentData for studentId ${studentId}: ${error.message}`);
                    resolve({ [studentId.toString()]: null }); // Return null or default structure for errors
                }
            }, index * delay)
        )
    );

    try {
        const studentDataList = await Promise.all(promises);
        return studentDataList;
    } catch (error) {
        console.error(`Error fetching student data: ${error.message}`);
        return [];
    }
}

}

module.exports = new ReadTheoryService();