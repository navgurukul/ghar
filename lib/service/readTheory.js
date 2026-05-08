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
      // Allow manual override using environment variables to avoid browser automation.
      // Set READTHEORY_BEARER and READTHEORY_COOKIE in your .env or container env.
      if (process.env.READTHEORY_BEARER && process.env.READTHEORY_COOKIE) {
        return { token: process.env.READTHEORY_BEARER, cookie: process.env.READTHEORY_COOKIE };
      }

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

      // store pre-login diagnostics
      try {
        this.lastLoginDiagnostics = {
          preLoginStatus: preLoginResponse?.status ?? null,
          preLoginSnippet: typeof preLoginResponse?.data === 'string' ? String(preLoginResponse.data).slice(0,300).replace(/\s+/g,' ') : null,
        };
      } catch (e) {
        this.lastLoginDiagnostics = { preLoginStatus: null, preLoginSnippet: null };
      }

      const preSetCookie = preLoginResponse?.headers?.["set-cookie"] || preLoginResponse?.headers?.["Set-Cookie"];
      const preCookie = (Array.isArray(preSetCookie) ? preSetCookie : preSetCookie ? [preSetCookie] : [])
        .map((item) => item.split(";")[0])
        .join(";");

      // Parse any hidden inputs (CSRF tokens or extra form fields) from the login page
      const loginPageHtml = preLoginResponse?.data || "";
      const hiddenInputs = {};
      try {
        const inputRegex = /<input[^>]*name=["']([^"']+)["'][^>]*value=["']([^"']*)["'][^>]*>/gi;
        let m;
        while ((m = inputRegex.exec(String(loginPageHtml))) !== null) {
          if (m[1]) hiddenInputs[m[1]] = m[2] || "";
        }
      } catch (e) {
        // ignore parse errors
      }

      const loginParams = Object.assign(
        {},
        hiddenInputs,
        {
          j_username: config.ReadTheory.read_theory_teacher,
          j_password: config.ReadTheory.read_theory_psw,
          ajaxLogin: "Log in",
        }
      );

      const loginPayload = new URLSearchParams(loginParams).toString();

      const response = await this.fetchHTTPResponse("https://readtheory.org/auth/doLogin", {
        method: "post",
        data: loginPayload,
        headers: {
          ...baseHeaders,
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: "https://readtheory.org",
          Referer: "https://readtheory.org/auth/login",
          "x-requested-with": "XMLHttpRequest",
          ...(preCookie ? { Cookie: preCookie } : {}),
        },
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: () => true,
      });

      // store login response diagnostics
      try {
        this.lastLoginDiagnostics = Object.assign(this.lastLoginDiagnostics || {}, {
          loginStatus: response?.status ?? null,
          loginSnippet: typeof response?.data === 'string' ? String(response.data).slice(0,300).replace(/\s+/g,' ') : null,
        });
      } catch (e) {
        // ignore
      }

      const setCookieHeader = response?.headers?.["set-cookie"] || response?.headers?.["Set-Cookie"];
      const loginCookie = (Array.isArray(setCookieHeader) ? setCookieHeader : setCookieHeader ? [setCookieHeader] : [])
        .map((item) => item.split(";")[0])
        .join(";");
      const mergedCookie = [preCookie, loginCookie].filter(Boolean).join(";");

      // save merged cookie in diagnostics
      this.lastLoginDiagnostics = Object.assign(this.lastLoginDiagnostics || {}, { mergedCookie });

      let authData = null;
      if (mergedCookie && response?.status < 400) {
        authData = await withTimeout(this.fetchTeacherIdAndToken(mergedCookie, baseHeaders), 30000, "Token fetch");
      }

      // If token not found, try a second login attempt that requests JSON explicitly
      if (!authData || !authData.token) {
        try {
          const resp2 = await this.fetchHTTPResponse("https://readtheory.org/auth/doLogin", {
            method: "post",
            data: loginPayload,
            headers: {
              ...baseHeaders,
              "Content-Type": "application/x-www-form-urlencoded",
              Origin: "https://readtheory.org",
              Referer: "https://readtheory.org/auth/login",
              Accept: "application/json, text/javascript, */*; q=0.01",
              "x-requested-with": "XMLHttpRequest",
              ...(preCookie ? { Cookie: preCookie } : {}),
            },
            timeout: 30000,
            maxRedirects: 5,
            validateStatus: () => true,
          });

          const setCookieHeader2 = resp2?.headers?.["set-cookie"] || resp2?.headers?.["Set-Cookie"];
          const loginCookie2 = (Array.isArray(setCookieHeader2) ? setCookieHeader2 : setCookieHeader2 ? [setCookieHeader2] : [])
            .map((item) => item.split(";")[0])
            .join(";");
          const mergedCookie2 = [preCookie, loginCookie2].filter(Boolean).join(";");

          if (mergedCookie2) {
            authData = await withTimeout(this.fetchTeacherIdAndToken(mergedCookie2, baseHeaders), 30000, "Token fetch 2");
            if (authData?.token) {
              return { token: authData.token, cookie: mergedCookie2 };
            }
          }
        } catch (err) {
          // continue to other fallbacks
        }
      }

      if (authData?.token) {
        return { token: authData.token, cookie: mergedCookie };
      }

      // No browser automation allowed — return diagnostics for why token could not be obtained
      const preStatus = preLoginResponse?.status ?? null;
      const loginStatus = response?.status ?? null;
      let respSnippet = '';
      try {
        respSnippet = typeof response?.data === 'string' ? response.data.slice(0, 300) : JSON.stringify(response?.data || '').slice(0, 300);
      } catch (e) {
        respSnippet = '';
      }
      const cleanSnippet = String(respSnippet).replace(/\s+/g, ' ').slice(0, 300);
      return { error: `Login failed: Missing Authorization Token. (preLogin=${preStatus}; login=${loginStatus}; snippet=${cleanSnippet})` };
    } catch (error) {
      return { error: `Error during login: ${error.message}` };
    }
  }

  async fetchAuthorizationToken(response) {
    const html = response?.data || "";
    const match = String(html).match(/"authorization":"([^"]+)"/);
    return match && match[1] ? match[1] : null;
  }

  async fetchTeacherIdAndToken(cookie, baseHeaders = {}) {
    try {
      const response = await this.fetchHTTPResponse("https://readtheory.org/app/student/list", {
        method: "get",
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Referer: "https://readtheory.org/",
          "User-Agent": baseHeaders["User-Agent"] || "Mozilla/5.0",
          ...baseHeaders,
          Cookie: cookie,
        },
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: () => true,
      });

      if (response?.error) {
        return { error: true, message: response.message };
      }

      if (!response?.data || response.status >= 400) {
        return null;
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
    const diagnostics = {
      studentListStatus: null,
      studentListHasData: false,
      endpoints: [],
    };

    const extractClassesFromPayload = (payload) => {
      if (!payload) return [];

      if (typeof payload === "string") {
        const parsed = this.parseOverviewData(payload);
        if (parsed) {
          return extractClassesFromPayload(parsed);
        }
        const bridgeData = this.parseBridgeDataFromHtml(payload);
        const bridgeClasses = Array.isArray(bridgeData?.classes) ? bridgeData.classes : null;
        if (Array.isArray(bridgeClasses)) return bridgeClasses;
        const markerClasses = this.parseJSONFromMarker(payload, "window.rt_bridge_page_data.classes");
        if (Array.isArray(markerClasses)) return markerClasses;
        const genericClasses = this.parseJSONFromMarker(payload, "classes");
        if (Array.isArray(genericClasses)) return genericClasses;
        return [];
      }

      if (Array.isArray(payload)) return payload;

      const candidates = [
        payload.classes,
        payload.data,
        payload.data?.classes,
        payload.data?.data,
        payload.result,
        payload.result?.classes,
        payload.payload,
        payload.payload?.classes,
        payload.list,
        payload.classList,
      ];

      for (const entry of candidates) {
        if (Array.isArray(entry)) return entry;
      }

      for (const value of Object.values(payload)) {
        if (Array.isArray(value)) return value;
        if (value && typeof value === "object") {
          const nested = extractClassesFromPayload(value);
          if (Array.isArray(nested) && nested.length) return nested;
        }
      }

      return [];
    };

    const response = await this.fetchHTTPResponse("https://readtheory.org/app/student/list", {
      method: "get",
      headers: {
        ...this.buildReadTheoryHeaders(token, cookie, "https://readtheory.org/app/student/list"),
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: () => true,
    });

    diagnostics.studentListStatus = response?.status ?? null;
    diagnostics.studentListHasData = Boolean(response?.data);

    if (!response?.error && response?.data && response.status < 400) {
      const html = String(response.data);
      const classes = this.parseJSONFromMarker(html, "window.rt_bridge_page_data.classes");
      if (Array.isArray(classes)) {
        this.lastClassFetchDiagnostics = diagnostics;
        return classes
          .map((cls) => ({ classId: Number(cls.classId), className: cls.name || null }))
          .filter((cls) => Number.isInteger(cls.classId) && cls.classId > 0 && cls.className);
      }
    }

    const classListEndpoints = [
      "https://readtheory.org/app/v2/teacher/class/list",
      "https://prod.readtheory.org/report/class/list",
    ];

    for (const endpoint of classListEndpoints) {
      const apiResponse = await this.fetchHTTPResponse(endpoint, {
        method: "get",
        headers: this.buildReadTheoryHeaders(token, cookie, endpoint),
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: () => true,
      });

      diagnostics.endpoints.push({
        url: endpoint,
        status: apiResponse?.status ?? null,
        hasData: Boolean(apiResponse?.data),
      });

      if (apiResponse?.error || !apiResponse?.data || apiResponse.status >= 400) {
        continue;
      }

      const classes = extractClassesFromPayload(apiResponse.data)
        .map((cls) => ({
          classId: Number(cls?.classId || cls?.id),
          className: cls?.name || cls?.className || null,
        }))
        .filter((cls) => Number.isInteger(cls.classId) && cls.classId > 0 && cls.className);

      if (classes.length) {
        this.lastClassFetchDiagnostics = diagnostics;
        return classes;
      }

      const sample = typeof apiResponse.data === "string"
        ? apiResponse.data.slice(0, 200)
        : JSON.stringify(apiResponse.data).slice(0, 200);
      diagnostics.endpoints[diagnostics.endpoints.length - 1].sample = sample;
    }

    this.lastClassFetchDiagnostics = diagnostics;
    return [];
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

  parseJSONBlockFromMarker(html, marker) {
    if (!html || !marker) return null;
    const markerIdx = html.indexOf(marker);
    if (markerIdx === -1) return null;

    let startIdx = -1;
    for (let i = markerIdx; i < html.length; i += 1) {
      const ch = html[i];
      if (ch === "{" || ch === "[") {
        startIdx = i;
        break;
      }
    }
    if (startIdx === -1) return null;

    const openChar = html[startIdx];
    const closeChar = openChar === "{" ? "}" : "]";
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
          const block = html.substring(startIdx, i + 1);
          try {
            return JSON.parse(block);
          } catch (error) {
            return null;
          }
        }
      }
    }

    return null;
  }

  parseJsonStringLiteral(raw, startIdx) {
    const quote = raw[startIdx];
    if (quote !== '"' && quote !== "'") return null;

    let escaped = false;
    let out = "";
    for (let i = startIdx + 1; i < raw.length; i += 1) {
      const ch = raw[i];
      if (escaped) {
        out += ch;
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === quote) {
        return { value: out, endIdx: i };
      }
      out += ch;
    }

    return null;
  }

  parseBridgeDataFromHtml(html) {
    if (!html) return null;

    const markerIdx = html.indexOf("rt_bridge_page_data");
    if (markerIdx === -1) return null;

    const parseIdx = html.indexOf("JSON.parse(", markerIdx);
    if (parseIdx !== -1) {
      const firstQuoteIdx = html.indexOf("\"", parseIdx);
      const firstSingleIdx = html.indexOf("'", parseIdx);
      const startIdx = firstQuoteIdx !== -1 && (firstSingleIdx === -1 || firstQuoteIdx < firstSingleIdx)
        ? firstQuoteIdx
        : firstSingleIdx;

      if (startIdx !== -1) {
        const parsed = this.parseJsonStringLiteral(html, startIdx);
        if (parsed?.value) {
          try {
            const unescaped = parsed.value.replace(/\\"/g, '"').replace(/\\'/g, "'");
            return JSON.parse(unescaped);
          } catch (error) {
            return null;
          }
        }
      }
    }

    return this.parseJSONBlockFromMarker(html, "window.rt_bridge_page_data");
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
      const studentNameValue = typeof student?.studentName === "string" ? student.studentName.trim().toLowerCase() : "";
      const fullNameValue = typeof student?.fullName === "string" ? student.fullName.trim().toLowerCase() : "";
      const studentUserIdValue = typeof student?.studentUserId === "string" ? student.studentUserId.trim().toLowerCase() : "";

      if (
        emailSet.has(usernameValue) ||
        emailSet.has(emailValue) ||
        emailSet.has(studentNameValue) ||
        emailSet.has(fullNameValue) ||
        emailSet.has(studentUserIdValue)
      ) {
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
      const diagnostics = this.lastClassFetchDiagnostics || {};
      const endpointSummary = Array.isArray(diagnostics.endpoints)
        ? diagnostics.endpoints
            .map((item) => {
              const sample = item.sample ? ` sample=${item.sample.replace(/\s+/g, " ")}` : "";
              return `${item.url}=${item.status ?? "NA"}${sample}`;
            })
            .join(" | ")
        : "";
      const studentListSummary = diagnostics.studentListStatus ?? "NA";
      const details = endpointSummary || studentListSummary ? ` (studentList=${studentListSummary}; endpoints=${endpointSummary || "none"})` : "";
      return { error: true, message: `Could not load teacher classes from ReadTheory.${details}` };
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
    return { students: [] };
  }
}

module.exports = new ReadTheoryService();