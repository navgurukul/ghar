const axios = require("axios");
const config = require("../config");

class ReadTheoryService {
  async fetchHTTPResponse(url, options = {}) {
    try {
      const response = await axios({ url, method: options.method || "get", ...options });
      return response;
    } catch (error) {
      return { error: true, message: `Error in fetchHTTPResponse: ${error.message}` };
    }
  }

  async login() {
    try {
      const withTimeout = (promise, ms, label) =>
        Promise.race([
          promise,
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`${label} timed out`)), ms);
          }),
        ]);

      const baseHeaders = {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      };

      const preLoginResponse = await this.fetchHTTPResponse("https://readtheory.org/auth/login", {
        method: "get",
        headers: {
          ...baseHeaders,
          Referer: "https://readtheory.org/",
        },
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: () => true,
      });

      const preSetCookie = preLoginResponse?.headers?.["set-cookie"] || preLoginResponse?.headers?.["Set-Cookie"];
      const preCookie = (Array.isArray(preSetCookie) ? preSetCookie : preSetCookie ? [preSetCookie] : [])
        .map((item) => item.split(";")[0])
        .join(";");

      const loginPayload = new URLSearchParams({
        j_username: config.ReadTheory.read_theory_teacher,
        j_password: config.ReadTheory.read_theory_psw,
        ajaxLogin: "Log in",
      }).toString();

      const response = await this.fetchHTTPResponse("https://readtheory.org/auth/doLogin", {
        method: "post",
        data: loginPayload,
        headers: {
          ...baseHeaders,
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: "https://readtheory.org",
          Referer: "https://readtheory.org/auth/login",
          ...(preCookie ? { Cookie: preCookie } : {}),
        },
        timeout: 30000,
        maxRedirects: 0,
        validateStatus: () => true,
      });

      const setCookieHeader = response?.headers?.["set-cookie"] || response?.headers?.["Set-Cookie"];
      const loginCookie = (Array.isArray(setCookieHeader) ? setCookieHeader : setCookieHeader ? [setCookieHeader] : [])
        .map((item) => item.split(";")[0])
        .join(";");
      const mergedCookie = [preCookie, loginCookie].filter(Boolean).join(";");

      let authData = null;
      if (mergedCookie && response?.status < 400) {
        authData = await withTimeout(this.fetchTeacherIdAndToken(mergedCookie), 30000, "Token fetch");
      }

      if (authData?.token) {
        return { token: authData.token, cookie: mergedCookie };
      }

      let playwright;
      try {
        playwright = require("playwright");
      } catch (error) {
        return { error: "Login failed, failed to fetch Authorization Token." };
      }

      const browser = await playwright.chromium.launch({ headless: true });
      const context = await browser.newContext({ userAgent: baseHeaders["User-Agent"] });
      const page = await context.newPage();
      page.setDefaultTimeout(30000);

      try {
        await withTimeout(
          page.goto("https://readtheory.org/auth/login", { waitUntil: "domcontentloaded", timeout: 30000 }),
          35000,
          "Browser login page"
        );
        await page.fill("input[name='j_username']", config.ReadTheory.read_theory_teacher || "");
        await page.fill("input[name='j_password']", config.ReadTheory.read_theory_psw || "");

        const submitSelector = "button[type='submit'], input[type='submit']";
        if ((await page.locator(submitSelector).count()) > 0) {
          await page.click(submitSelector);
        } else {
          await page.keyboard.press("Enter");
        }

        await page.waitForURL(/readtheory\.org\/(app|dashboard|student)/, { timeout: 30000 }).catch(() => null);
        await withTimeout(
          page.goto("https://readtheory.org/app/student/list", { waitUntil: "domcontentloaded", timeout: 30000 }),
          35000,
          "Browser student list page"
        );

        const browserCookies = await context.cookies();
        const cookie = browserCookies
          .filter((c) => c?.name && c?.value)
          .map((c) => `${c.name}=${c.value}`)
          .join(";");

        if (!cookie) {
          return { error: "Login failed. No authentication cookie received." };
        }

        const studentListHtml = await page.content();
        const token = await this.fetchAuthorizationToken({ data: studentListHtml });
        if (!token) {
          return { error: "Login failed, failed to fetch Authorization Token." };
        }

        return { token, cookie };
      } finally {
        await browser.close();
      }
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

    if (!response?.error && response?.data && response.status < 400) {
      const html = String(response.data);
      const classes = this.parseJSONFromMarker(html, "window.rt_bridge_page_data.classes");
      if (Array.isArray(classes)) {
        return classes
          .map((cls) => ({ classId: Number(cls.classId), className: cls.name || null }))
          .filter((cls) => Number.isInteger(cls.classId) && cls.classId > 0 && cls.className);
      }
    }

    let playwright;
    try {
      playwright = require("playwright");
    } catch (error) {
      return [];
    }

    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    });

    try {
      const cookieParts = this.parseCookieParts(cookie);
      if (cookieParts.length) {
        await context.addCookies(
          cookieParts.map((c) => ({ name: c.name, value: c.value, domain: ".readtheory.org", path: "/", httpOnly: false, secure: true }))
        );
      }

      const page = await context.newPage();
      await page.goto("https://readtheory.org/app/student/list", { waitUntil: "domcontentloaded", timeout: 60000 });

      const html = await page.content();
      const classes = this.parseJSONFromMarker(String(html), "window.rt_bridge_page_data.classes");
      if (!Array.isArray(classes)) {
        return [];
      }

      return classes
        .map((cls) => ({ classId: Number(cls.classId), className: cls.name || null }))
        .filter((cls) => Number.isInteger(cls.classId) && cls.classId > 0 && cls.className);
    } catch (error) {
      return [];
    } finally {
      await browser.close();
    }
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

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const ids = [...new Set(studentIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
    const maxConcurrency = 4;
    const maxAttempts = 2;
    const baseDelay = Number.isFinite(delay) && delay > 0 ? delay : 0;
    const results = [];
    let currentIndex = 0;

    const fetchSingleStudent = async (studentId) => {
      const singleStudentDataURL = `https://readtheory.org/dashboard/viewProfileForStudent?studentId=${studentId}&beginDateString=null&endDateString=null&jsonFormat=true`;
      const dataHeaders = {
        Cookie: cookie,
        Authorization: `Bearer ${token}`,
        Referer: `https://readtheory.org/app/teacher/reports/student/${studentId}`,
        "x-requested-with": "XMLHttpRequest",
      };

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const response = await this.fetchHTTPResponse(singleStudentDataURL, {
            method: "get",
            headers: dataHeaders,
            timeout: 30000,
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 303,
          });

          if (!response?.error) {
            const command = response?.data?.data?.command;
            if (command) {
              return {
                [String(studentId)]: {
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
                },
              };
            }
          }
        } catch (error) {
          // retry below
        }

        if (attempt < maxAttempts) {
          await wait(400 * attempt);
        }
      }

      return { [String(studentId)]: null };
    };

    const worker = async () => {
      while (true) {
        const idx = currentIndex;
        currentIndex += 1;
        if (idx >= ids.length) return;

        if (baseDelay > 0) {
          await wait(baseDelay);
        }

        const studentId = ids[idx];
        const result = await fetchSingleStudent(studentId);
        results.push(result);
      }
    };

    try {
      const workerCount = Math.min(maxConcurrency, ids.length || 1);
      await Promise.all(Array.from({ length: workerCount }, () => worker()));
      return results;
    } catch (error) {
      return { error: true, message: `Error fetching student data: ${error.message}` };
    }
  }

  async buildStudentsFromMatches(matches, token, cookie) {
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

      return matches.map((student) => {
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
  }

  normalizeEmailList(email) {
    const normalizeEmailToken = (item) =>
      typeof item === "string"
        ? item
            .trim()
            .replace(/^['"\[]+/, "")
            .replace(/['"\]]+$/, "")
            .trim()
            .toLowerCase()
        : "";

    return [
      ...new Set(
        (
          Array.isArray(email)
            ? email.map((item) => normalizeEmailToken(item)).filter(Boolean)
            : typeof email === "string"
              ? email
                  .split(",")
                  .map((item) => normalizeEmailToken(item))
                  .filter(Boolean)
              : []
        )
      ),
    ];
  }

  addMatchingStudents(matches, studentsFromOverview, cls, emailSet) {
    for (const student of studentsFromOverview) {
      const usernameValue = typeof student?.username === "string" ? student.username.trim().toLowerCase() : "";
      const emailValue = typeof student?.email === "string" ? student.email.trim().toLowerCase() : "";

      if (emailSet.has(usernameValue) || emailSet.has(emailValue)) {
        matches.push({ ...student, classId: cls.classId, className: cls.className });
      }
    }
  }

  parseOverviewData(rawData) {
    if (typeof rawData === "object") return rawData;
    try {
      return JSON.parse(String(rawData));
    } catch (error) {
      return null;
    }
  }

  getBridgeStudents(bridgeData) {
    const candidateArrays = [
      bridgeData?.students,
      bridgeData?.classOverview?.students,
      bridgeData?.overview?.students,
      bridgeData?.report?.students,
      bridgeData?.data?.students,
    ];
    return candidateArrays.find((arr) => Array.isArray(arr)) || [];
  }

  parseCookieParts(cookie) {
    return String(cookie || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const idx = part.indexOf("=");
        if (idx <= 0) return null;
        return { name: part.slice(0, idx).trim(), value: part.slice(idx + 1).trim() };
      })
      .filter(Boolean);
  }

  async fetchStudentOverviewByEmail(email) {
    const normalizedEmailList = this.normalizeEmailList(email);

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

      const overviewData = this.parseOverviewData(overviewResponse.data);
      const studentsFromOverview = Array.isArray(overviewData?.students) ? overviewData.students : [];
      this.addMatchingStudents(matches, studentsFromOverview, cls, emailSet);
    }

    if (matches.length) {
      const students = await this.buildStudentsFromMatches(matches, token, cookie);
      return { students };
    }
    let playwright;
    try {
      playwright = require("playwright");
    } catch (error) {
      return { students: [] };
    }

    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    });

    try {
      const cookieParts = this.parseCookieParts(cookie);

      if (cookieParts.length) {
        await context.addCookies(
          cookieParts.map((c) => ({
            name: c.name,
            value: c.value,
            domain: ".readtheory.org",
            path: "/",
            httpOnly: false,
            secure: true,
          }))
        );
      }

      const page = await context.newPage();
      await page.goto("https://readtheory.org/app/student/list", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => null);

      for (const cls of classes) {
        const pageUrl = `https://readtheory.org/app/v2/teacher/reports/class/overview?classId=${cls.classId}&dateTemplate=last-30-days`;
        let studentsFromOverview = [];
        try {
          await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
          const bridgeData = await page.evaluate(() => {
            try {
              return (typeof window !== "undefined" && window.rt_bridge_page_data) ? window.rt_bridge_page_data : null;
            } catch (error) {
              return null;
            }
          });

          studentsFromOverview = this.getBridgeStudents(bridgeData);

          // If page bridge data does not include students, query the class overview endpoint from browser context.
          if (!studentsFromOverview.length) {
            const overviewApiUrl = `https://prod.readtheory.org/report/class/${cls.classId}/overview?startDate=${startDate}&endDate=${endDate}`;
            try {
              const apiResp = await context.request.get(overviewApiUrl, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Origin: "https://readtheory.org",
                  Referer: pageUrl,
                  Accept: "application/json, text/plain, */*",
                  "x-requested-with": "XMLHttpRequest",
                },
                timeout: 60000,
              });

              if (apiResp.ok()) {
                const apiData = await apiResp.json().catch(() => null);
                studentsFromOverview = Array.isArray(apiData?.students) ? apiData.students : [];
              }
            } catch (error) {
              // keep empty array and continue safely
            }
          }
        } catch (error) {
          studentsFromOverview = [];
        }

        this.addMatchingStudents(matches, studentsFromOverview, cls, emailSet);
      }
    } finally {
      await browser.close();
    }

    if (!matches.length) {
      return { students: [] };
    }

    const students = await this.buildStudentsFromMatches(matches, token, cookie);

    return { students };
  }
}

module.exports = new ReadTheoryService();