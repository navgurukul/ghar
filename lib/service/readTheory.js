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

      if (!response?.headers?.["set-cookie"]) {
        return { error: "Login failed. No authentication cookie received." };
      }

      const cookie = response.headers["set-cookie"]
        .map((item) => item.split(";")[0])
        .join(";");

      const authData = await this.fetchTeacherIdAndToken(cookie);
      if (!authData || authData.error || !authData.token) {
        return { error: "Login failed, failed to fetch Authorization Token." };
      }

      return { token: authData.token, cookie };
    } catch (error) {
      return { error: `Error during login: ${error.message}` };
    }
  }

  async fetchAuthorizationToken(response) {
    const html = response?.data || "";
    const match = String(html).match(/"authorization":"([^"]+)"/);
    return match && match[1] ? match[1] : null;
  }

  async fetchTeacherIdAndToken(cookie) {
    try {
      const response = await this.fetchHTTPResponse("https://readtheory.org/app/student/list", {
        method: "get",
        headers: { Cookie: cookie },
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 303,
      });

      if (response?.error) {
        return { error: true, message: response.message };
      }

      const token = await this.fetchAuthorizationToken(response);
      if (!token) {
        return null;
      }

      return { token };
    } catch (error) {
      return { error: true, message: `Error fetching Authorization Token: ${error.message}` };
    }
  }

  resolveDateRangeFromTemplate(dateTemplate) {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (dateTemplate) {
      case 'last-7-days':
        start.setDate(start.getDate() - 7);
        break;
      case 'last-30-days':
        start.setDate(start.getDate() - 30);
        break;
      case 'last-90-days':
        start.setDate(start.getDate() - 90);
        break;
      case 'this-year':
        start.setMonth(0, 1);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { startDate: start.getTime(), endDate: end.getTime() };
  }

  buildReadTheoryHeaders(token, cookie, referer = "https://readtheory.org/app/v2/teacher/class/list") {
    return {
      Cookie: cookie,
      Authorization: `Bearer ${token}`,
      Origin: "https://readtheory.org",
      Referer: referer,
      Accept: "application/json, text/plain, */*",
      "x-requested-with": "XMLHttpRequest",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    };
  }

  async fetchTeacherClassesFromPage(cookie, token) {
    const response = await this.fetchHTTPResponse("https://readtheory.org/app/student/list", {
      method: "get",
      headers: {
        Cookie: cookie,
        Authorization: `Bearer ${token}`,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0",
      },
      maxRedirects: 5,
      validateStatus: () => true,
    });

    if (response?.error || !response?.data || response.status >= 400) {
      return [];
    }

    const html = String(response.data);
    const classes = this.parseJSONFromMarker(html, "window.rt_bridge_page_data.classes");
    if (!Array.isArray(classes)) {
      return [];
    }

    return classes
      .map((cls) => ({ classId: Number(cls.classId), className: cls.name || null }))
      .filter((cls) => Number.isInteger(cls.classId) && cls.classId > 0 && cls.className);
  }

  parseJSONFromMarker(html, marker) {
    if (!html || !marker) return null;
    const markerIdx = html.indexOf(marker);
    if (markerIdx === -1) return null;

    const startIdx = html.indexOf("[", markerIdx);
    if (startIdx === -1) return null;

    const openChar = html[startIdx];
    const closeChar = openChar === "[" ? "]" : "}";
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = startIdx; i < html.length; i += 1) {
      const ch = html[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\" && inString) {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (ch === openChar) depth += 1;
      if (ch === closeChar) {
        depth -= 1;
        if (depth === 0) {
          try {
            return JSON.parse(html.substring(startIdx, i + 1));
          } catch (error) {
            return null;
          }
        }
      }
    }

    return null;
  }

  async fetchStudentData(studentIds, delay, session = null) {
    let token;
    let cookie;

    if (session?.token && session?.cookie) {
      token = session.token;
      cookie = session.cookie;
    } else {
      const loginDetails = await this.login();
      if (loginDetails.error) {
        return { error: true, message: `Login failed: ${loginDetails.error}` };
      }
      token = loginDetails.token;
      cookie = loginDetails.cookie;
    }

    if (!token || !cookie) {
      return { error: true, message: "Login failed: Missing token or cookie" };
    }

    const promises = studentIds.map(
      (studentId, index) =>
        new Promise((resolve) => {
          setTimeout(async () => {
            try {
              const singleStudentDataURL = `https://readtheory.org/dashboard/viewProfileForStudent?studentId=${studentId}&beginDateString=null&endDateString=null&jsonFormat=true`;
              const dataHeaders = {
                Cookie: cookie,
                Authorization: `Bearer ${token}`,
                Referer: `https://readtheory.org/app/teacher/reports/student/${studentId}`,
                "x-requested-with": "XMLHttpRequest",
              };

              const response = await this.fetchHTTPResponse(singleStudentDataURL, {
                method: "get",
                headers: dataHeaders,
                maxRedirects: 0,
                validateStatus: (status) => status >= 200 && status < 303,
              });

              if (response?.error) {
                resolve({ [String(studentId)]: null });
                return;
              }

              const command = response?.data?.data?.command;
              if (!command) {
                resolve({ [String(studentId)]: null });
                return;
              }

              const studentData = {
                studentId: String(command.studentId),
                username: command.username,
                fullName: `${command.firstName || ""} ${command.lastName || ""}`.trim(),
                email: command.email,
                lastLoginDate: command.lastLoginDate ? String(command.lastLoginDate).split("T")[0] : "",
                currentLevel: command.currentLevel,
                initialLevel: command.initialLevel,
                highestLevel: command.highestLevel,
                initialLexileLevel: command.initialLexileLevel,
                averageLexileLevel: command.averageLexileLevel,
                averageQuizLevel: command.averageQuizLevel,
                quizzesAboveInitialGradeLevel: command.quizzesAboveInitialGradeLevel,
                quizzesBelowInitialGradeLevel: command.quizzesBelowInitialGradeLevel,
                quizzesCompleted: command.quizzesCompleted,
                quizzesPassed: command.quizzesPassed,
                quizzesFailed: command.quizzesFailed,
                pointsEarned: command.pointsEarned,
                totalPoints: command.totalPoints,
              };

              resolve({ [String(studentId)]: studentData });
            } catch (error) {
              resolve({ [String(studentId)]: null });
            }
          }, index * delay);
        })
    );

    try {
      return await Promise.all(promises);
    } catch (error) {
      return { error: true, message: `Error fetching student data: ${error.message}` };
    }
  }

  async fetchStudentOverviewByEmail(email) {
    const normalizeEmailToken = (item) =>
      typeof item === "string"
        ? item
            .trim()
            .replace(/^['"\[]+/, "")
            .replace(/['"\]]+$/, "")
            .trim()
            .toLowerCase()
        : "";

    const normalizedEmailList = Array.isArray(email)
      ? email.map((item) => normalizeEmailToken(item)).filter(Boolean)
      : typeof email === "string"
        ? email
            .split(",")
            .map((item) => normalizeEmailToken(item))
            .filter(Boolean)
        : [];

    if (!normalizedEmailList.length) {
      return { error: true, message: "Please provide email." };
    }

    const emailSet = new Set(normalizedEmailList);
    const loginDetails = await this.login();
    if (loginDetails.error) {
      return { error: true, message: `Login failed: ${loginDetails.error}` };
    }

    const { token, cookie } = loginDetails;
    const classes = await this.fetchTeacherClassesFromPage(cookie, token);
    if (!classes.length) {
      return { error: true, message: "Could not load teacher classes from ReadTheory." };
    }

    const { startDate, endDate } = this.resolveDateRangeFromTemplate('last-30-days');
    const matches = [];

    for (const cls of classes) {
      const pageUrl = `https://readtheory.org/app/v2/teacher/reports/class/overview?classId=${cls.classId}&dateTemplate=last-30-days`;
      const overviewApiUrl = `https://prod.readtheory.org/report/class/${cls.classId}/overview?startDate=${startDate}&endDate=${endDate}`;
      const headers = {
        ...this.buildReadTheoryHeaders(token, cookie, pageUrl),
        "Content-Type": "application/json",
      };

      const overviewResponse = await this.fetchHTTPResponse(overviewApiUrl, {
        method: "get",
        headers,
        maxRedirects: 5,
        validateStatus: () => true,
      });

      if (overviewResponse?.error || !overviewResponse?.data || overviewResponse.status >= 400) {
        continue;
      }

      const overviewData =
        typeof overviewResponse.data === "object"
          ? overviewResponse.data
          : (() => {
              try {
                return JSON.parse(String(overviewResponse.data));
              } catch (error) {
                return null;
              }
            })();

      const studentsFromOverview = Array.isArray(overviewData?.students) ? overviewData.students : [];
      for (const student of studentsFromOverview) {
        const usernameValue = typeof student?.username === "string" ? student.username.trim().toLowerCase() : "";
        const emailValue = typeof student?.email === "string" ? student.email.trim().toLowerCase() : "";

        if (emailSet.has(usernameValue) || emailSet.has(emailValue)) {
          matches.push({ ...student, classId: cls.classId, className: cls.className });
        }
      }
    }

    if (!matches.length) {
      return { students: [] };
    }

    const studentIds = [...new Set(matches.map((student) => Number(student?.studentId)).filter((id) => Number.isInteger(id) && id > 0))];
    const profileDetails = await this.fetchStudentData(studentIds, 60, { token, cookie });

    const profileMap = new Map();
    if (Array.isArray(profileDetails)) {
      for (const entry of profileDetails) {
        const id = Number(Object.keys(entry || {})[0]);
        const profile = id ? entry[id] : null;
        if (Number.isInteger(id) && profile) {
          profileMap.set(id, profile);
        }
      }
    }

    const students = matches.map((student) => {
      const studentId = Number(student.studentId);
      const profile = profileMap.get(studentId) || null;

      const profileName = (profile?.fullName || "").trim();
      const usableProfileName =
        profileName &&
        profileName.toLowerCase() !== "null null" &&
        profileName.toLowerCase() !== "undefined undefined"
          ? profileName
          : null;

      const overviewName = (student.studentName || "").trim();
      const usableOverviewName = overviewName && overviewName.toLowerCase() !== "unknown" ? overviewName : null;
      const usernameValue = student.username || profile?.username || null;
      const fullName = usableProfileName || usableOverviewName || usernameValue || "Unknown";
      const profileEmail = typeof profile?.email === "string" ? profile.email.trim() : "";
      const fallbackEmail = typeof usernameValue === "string" && usernameValue.includes("@") ? usernameValue.trim() : null;

      return {
        classId: Number(student.classId) || null,
        className: student.className || null,
        studentId,
        studentUserId: student.studentUserId || null,
        userId: student.studentUserId || null,
        studentName: fullName,
        username: usernameValue,
        email: profileEmail || fallbackEmail,
        quizzesPassed: Number(student.quizzesPassed || 0),
        quizzesFailed: Number(student.quizzesFailed || 0),
        quizzesTaken: Number(student.quizzesPassed || 0) + Number(student.quizzesFailed || 0),
        currentGradeLevel: student.endGradeLevel ?? null,
        currentLexileLevel: student.endLexileLevel ?? null,
        totalKnowledgePoints: Number(student.totalKnowledgePoints || 0),
        lastLoginDate: profile?.lastLoginDate || null,
      };
    });

    return { students };
  }
}

module.exports = new ReadTheoryService();