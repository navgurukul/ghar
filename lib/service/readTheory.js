const axios = require("axios");
const config = require("../config");

class ReadTheoryService {
  async fetchHTTPResponse(url, options) {
    try {
      const response = await axios({ method: "post", url, ...options });
      return response;
    } catch (error) {
      return { error: true, message: `Error in fetchHTTPResponse: ${error.message}` };
    }
  }

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

        const teacherData = await this.fetchTeacherIdAndToken(cookie);
        if (!teacherData) {
          return { error: "Login failed, failed to fetch Teacher ID or Authorization Token." };
        }

        const { teacherId, token } = teacherData;
        return { teacherId, token, cookie };
      } else {
        console.log("Login failed. No authentication cookie received.");
        return { error: "Login failed. No authentication cookie received." };
      }
    } catch (error) {
      console.error(`Error during login: ${error.message}`);
      return { error: `Error during login: ${error.message}` };
    }
  }

  async fetchTeacherId(response) {
    const html = response.data;
    const match = html.match(/"teacherId":\s*(\d+)/);
    return match && match[1] ? parseInt(match[1]).toString() : null;
  }

  async fetchAuthorizationToken(response) {
    const html = response.data;
    const match = html.match(/"authorization":"([^"]+)"/);
    return match && match[1] ? match[1] : null;
  }

  async fetchTeacherIdAndToken(cookie) {
    const studentsURL = "https://readtheory.org/app/student/list";

    try {
      const response = await this.fetchHTTPResponse(studentsURL, {
        method: "get",
        headers: { Cookie: cookie },
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 303,
      });

      if (response.error) {
        return { error: true, message: response.message };
      }

      const teacherId = await this.fetchTeacherId(response);
      const token = await this.fetchAuthorizationToken(response);

      if (!teacherId || !token) {
        return null;
      }
      return { teacherId, token };
    } catch (error) {
      return { error: true, message: `Error fetching Teacher ID and Authorization Token: ${error.message}` };
    }
  }

  async fetchStudentData(studentIds, delay) {
    const loginDetails = await this.login();
    if (loginDetails.error) {
      return { error: true, message: `Login failed: ${loginDetails.message}` };
    }

    const { token, cookie } = loginDetails;

    if (!token || !cookie) {

      return { error: true, message: "Login failed: Missing token or cookie" };
    }

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

            if (response.error) {
              resolve({ [studentId.toString()]: null });
            } else if (response && response.data && response.data.data && response.data.data.command) {
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
              resolve({ [studentId.toString()]: null });
            }
          } catch (error) {
            console.error(`Error fetching student data for ID ${studentId}: ${error.message}`);
            resolve({ [studentId.toString()]: null });
          }
        }, index * delay)
      )
    );

    try {
      const studentDataList = await Promise.all(promises);
      return studentDataList;
    } catch (error) {
      return { error: true, message: `Error fetching student data: ${error.message}` };
    }
  }
}

module.exports = new ReadTheoryService();