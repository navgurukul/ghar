const axios = require('axios');
const config = require('../config');

class ReadTheoryService {
  // Method to fetch HTTP response using axios
  async fetchHTTPResponse(url, options) {
    try {
      const response = await axios({ method: 'post', url, ...options });
      return response;
    } catch (error) {
      throw new Error(`Error in fetchHTTPResponse: ${error.message}`);
    }
  }

  // Method to perform login and retrieve authentication details
  async login() {
    try {
      const response = await this.fetchHTTPResponse('https://readtheory.org/auth/doLogin', {
        method: 'post',
        data: {
          j_username: config.ReadTheory.read_theory_teacher,
          j_password: config.ReadTheory.read_theory_psw,
          ajaxLogin: 'Log in',
        },
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status < 303,
      });

      if (response.headers['set-cookie']) {
        const cookie = response.headers['set-cookie'].map(cookie => cookie.split(";")[0]).join(";");

        const { teacherId, token } = await this.fetchTeacherIdAndToken(cookie);

        return { teacherId, token, cookie };
      } else {
        console.error('Login failed. No authentication cookie received.');
      }
    } catch (error) {
      console.error('Error during login:', error.message);
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
    const studentsURL = 'https://readtheory.org/app/student/list';

    try {
      const response = await this.fetchHTTPResponse(studentsURL, {
        method: 'get',
        headers: { 'Cookie': cookie },
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status < 303,
      });

      const teacherId = await this.fetchTeacherId(response);
      const token = await this.fetchAuthorizationToken(response);

      return { teacherId, token };
    } catch (error) {
      throw new Error(`Error fetching Teacher ID and Authorization Token: ${error.message}`);
    }
  }

  // Method to fetch classes list JSON
  async fetchClassesListJson() {
    const { teacherId, token, cookie } = await this.login();
    const classDataURL = `https://prod.readtheory.org/class/teacher/${teacherId}`;

    try {
      const response = await this.fetchHTTPResponse(classDataURL, {
        method: 'get',
        headers: { 'Authorization': `Bearer ${token}`, 'Cookie': cookie },
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status < 303,
      });

      const classesListJson = response.data;

      return classesListJson;
    } catch (error) {
      console.error('Error fetching Classes List JSON:', error.message);
      return null;
    }
  }

  // Method to fetch student data for a specific number of students
  async fetchStudentData() {
    const { token, studentIds, cookie, classesListJson } = await this.fetchMyStudentsListJson();
    const studentDataList = [];

    // Fetch data for the students 
    for (let i = 0; i < studentIds.length; i++) {
      const studentId = studentIds[i];
      const studentData = await this.getStudentData(studentId, token, cookie, classesListJson);

      if (studentData) {
        studentDataList.push(studentData);
        
      }
    }
    return studentDataList;
  }

  // Method to get detailed data for a specific student
  async getStudentData(studentId, token, cookie, classesListJson) {
    try {
      const singleStudentDataURL = `https://readtheory.org/dashboard/viewProfileForStudent?studentId=${studentId}&beginDateString=null&endDateString=null&jsonFormat=true`;

      const dataHeaders = {
        Cookie: cookie,
        Authorization: 'Bearer ' + token,
        Referer: `https://readtheory.org/app/teacher/reports/student/${studentId}`,
        'x-requested-with': 'XMLHttpRequest',
      };

      const response = await this.fetchHTTPResponse(singleStudentDataURL, {
        method: 'get',
        headers: dataHeaders,
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status < 303,
      });

      if (response.data && response.data.data && response.data.data.command) {
        const index = response.data.data.command;
        const [student_classes, student_class_max] = this.getStudentClassData(index.classIds, classesListJson);

        const studentData = {
          studentId: index.studentId.toString(),
          username: index.username,
          fullName: index.firstName + " " + index.lastName,
          email: index.email,
          studentClasses: student_classes,
          studentClassMax: student_class_max,
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
    } catch (error) {
      console.error(`Error in getStudentData for studentId ${studentId}: ${error.message}`);
      return null;
    }
  }

  // Method to extract student classes data
  getStudentClassData(classIds, classes) {
    let student_classes = "";
    let student_class_max = "";
    let max = -1;

    for (let i in classIds) {
      let classId = classIds[i];

      for (let j in classes) {
        let clas = classes[j];

        if (clas.id == classId) {
          student_classes = [student_classes, clas.name].filter(Boolean).join(", ");

          if (clas.students && clas.students > max) {
            max = clas.students;
            student_class_max = clas.name;
          }
          break;
        }
      }
    }

    return [student_classes, student_class_max];
  }

  // Method to fetch JSON data for the list of students
  async fetchMyStudentsListJson() {
    const { teacherId, token, cookie } = await this.login();
    const studentsDataURL = `https://prod.readtheory.org/class/teacher/${teacherId}/students`;

    try {
      const response = await this.fetchHTTPResponse(studentsDataURL, {
        method: 'get',
        headers: { 'Authorization': `Bearer ${token}`, 'Cookie': cookie },
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status < 303,
      });

      const studentsListJson = response.data;
      const studentIds = this.extractStudentIds(studentsListJson);

      // Fetch classes list JSON
      const classesListJson = await this.fetchClassesListJson(teacherId, token, cookie);

      // Continue with further processing if needed
      return { token, studentIds, cookie, classesListJson };
    } catch (error) {
      console.error(`Error fetching My Students List JSON: ${error.message}`);
    }
  }

  // Method to extract student IDs from the list of students JSON
  extractStudentIds(studentsListJson) {
    const studentIds = [];

    for (const student of studentsListJson) {
      if (student.id) {
        studentIds.push(student.id);
      }
    }

    return studentIds;
  }
}

// Export an instance of the ReadTheoryService
module.exports = new ReadTheoryService();