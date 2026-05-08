const readTheoryService = require('../service/readTheory');
const Joi = require("joi");
const verifyService = require("../service/gharUser")
const Boom = require("@hapi/boom");

const parseEmailList = (value) => {
  if (value === undefined || value === null || value === "") return [];

  const normalizeEmailToken = (item) => {
    if (typeof item !== "string") return "";
    return item
      .trim()
      .replace(/^['"\[]+/, "")
      .replace(/['"\]]+$/, "")
      .trim()
      .toLowerCase();
  };

  const parseItems = (items) =>
    items
      .map((item) => normalizeEmailToken(item))
      .filter((item) => item.length > 0);

  if (Array.isArray(value)) {
    return parseItems(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parseItems(parsed);
      } catch (error) {
        return parseItems(trimmed.split(","));
      }
    }

    return parseItems(trimmed.split(","));
  }

  return [];
};

module.exports = [
  {
    method: "GET",
    path: "/ReadTheory/studentOverviewByEmail",
    options: {
      description: "Overview by email",
      tags: ["readtheory", "api"],
      cors: {
        origin: ["*"],
        headers: ["Accept", "Authorization", "Content-Type", "If-None-Match", "Origin", "X-Requested-With"],
        additionalHeaders: ["cache-control", "x-requested-with"],
      },
      pre: [
        {
          assign: "auth",
          method: async (request, h) => {
            const tokenHeader = request.headers.authorization || request.headers.Authorization;
            const queryToken = request.query?.token || request.query?.authorization;
            const fallbackToken = process.env.READTHEORY_ROUTE_TOKEN || process.env.ACCESS_KEY;
            const tokenValue = tokenHeader || queryToken || fallbackToken;

            if (!tokenValue) {
              if (process.env.READTHEORY_REQUIRE_ROUTE_AUTH === "1") {
                return Boom.unauthorized("No token provided");
              }
              return true;
            }

            const token = tokenValue.startsWith("Bearer ")
              ? tokenValue.split(" ")[1]
              : tokenValue;

            const isValid = await verifyService.verifyToken({ token: token });
            if (!isValid) {
              if (process.env.READTHEORY_REQUIRE_ROUTE_AUTH === "1") {
                return Boom.unauthorized("Invalid token");
              }
              return true;
            }

            return true;
          },
        },
      ],
      validate: {
        query: Joi.object({
          email: Joi.string().trim().required().description("email or email list"),
          token: Joi.string().trim().optional().description("optional route auth token"),
          authorization: Joi.string().trim().optional().description("optional route auth token"),
        }).unknown(true),
      },
    },
    handler: async (request, h) => {
      try {
        const { email } = request.query;
        const parsedEmails = parseEmailList(email);
        const result = await readTheoryService.fetchStudentOverviewByEmail(parsedEmails);
        return h.response(result).code(result.error ? 500 : 200);
      } catch (error) {
        return h.response({ error: "Internal Server Error" }).code(500);
      }
    },
  },
];