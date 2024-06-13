const axios = require("axios");
const config = require("../config");

class ReadTheoryService {
  // Method to fetch HTTP response using axios
  async fetchHTTPResponse(url, options) {
    try {
      const response = await axios({ method: "post", url, ...options });
      return response;
    } catch (error) {
      throw new Error(`Error in fetchHTTPResponse: ${error.message}`);
    }
  }

  // Method to perform login and retrieve authentication details
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
      }
    } catch (error) {
      console.error("Error during login:", error.message);
    }
  }

  // Method to extract teacherId from the login response
  async fetchTeacherId(response) {
    const html = response.data;
    const match = html.match(/"teacherId":\s*(\d+)/);
    return match && match[1] ? parseInt(match[1]).toString() : null;
  }

  // Method to extract authorization token from the login response
  async fetchAuthorizationToken(response) {
    const html = response.data;
    const match = html.match(/"authorization":"([^"]+)"/);
    return match && match[1] ? match[1] : null;
  }

  // Method to fetch teacherId and authorization token using the authentication cookie
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

  // Method to get detailed data for a specific student
  async getStudentsData(studentIds, token, cookie) {
    try {
      const promises = studentIds.map(studentId => {
        const singleStudentDataURL = `https://readtheory.org/dashboard/viewProfileForStudent?studentId=${studentId}&beginDateString=null&endDateString=null&jsonFormat=true`;
  
        const dataHeaders = {
          Cookie: cookie,
          Authorization: "Bearer " + token,
          Referer: `https://readtheory.org/app/teacher/reports/student/${studentId}`,
          "x-requested-with": "XMLHttpRequest",
        };
  
        return this.fetchHTTPResponse(singleStudentDataURL, {
          method: "get",
          headers: dataHeaders,
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 303,
        });
      });
  
      const responses = await Promise.all(promises);
  
      const studentsData = responses.map(response => {
        if (response.data && response.data.data && response.data.data.command) {
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
          return studentData;
        } else {
          console.error(`Empty or unexpected response for studentId ${studentId}`, response.data);
          return null;
        }
      });

      return studentsData;
    } catch (error) {
      console.error(`Error in getStudentsData: ${error.message}`);
      return null;
    }
  }

  // Method to fetch data for multiple students with delay
  async fetchStudentData(studentIds, delay) {
    const { token, cookie } = await this.login();
  
    const promises = studentIds.map((studentId, index) =>
      new Promise(resolve =>
        setTimeout(() => resolve(this.getStudentsData([studentId], token, cookie)), index * delay)
      )
    );
  
    try {
      const studentDataList = await Promise.all(promises);
      return studentDataList.flat().filter((studentData) => studentData !== null);
    } catch (error) {
      console.error(`Error fetching student data: ${error.message}`);
      return [];
    }
  }
}

module.exports = new ReadTheoryService();
