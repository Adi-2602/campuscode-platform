const axios = require("axios");
const config = require("../config/judge0.config");

// Extra headers for hosted Judge0 on RapidAPI. A self-hosted Judge0 needs none,
// so the headers are only added when JUDGE0_API_KEY is set.
const authHeaders = () => {
  if (!config.apiKey) return {};
  return {
    "X-RapidAPI-Key": config.apiKey,
    "X-RapidAPI-Host": config.apiHost
  };
};

// Fetch languages
const fetchLanguages = async () => {
  const response = await axios.get(
    `${config.baseURL}/languages`,
    { headers: authHeaders(), timeout: config.timeoutLanguages }
  );
  return response.data;
};

// Submit code
const submitCode = async ({ language_id, source_code, stdin, wait = false }) => {
  const response = await axios.post(
    `${config.baseURL}/submissions?wait=${wait}&base64_encoded=true`, 
    {
      language_id,
      source_code: Buffer.from(source_code).toString("base64"), // Encode source to base64
      stdin: stdin ? Buffer.from(stdin).toString("base64") : null
    },
    {
      headers: { "Content-Type": "application/json", ...authHeaders() },
      timeout: config.timeoutSubmission
    }
  );

  return response.data; // Returns { token: "..." }
};

// ✨ NEW: Fetch submission result
const fetchSubmission = async (token) => {
  const response = await axios.get(
    `${config.baseURL}/submissions/${token}?base64_encoded=true`,
    { headers: authHeaders(), timeout: config.timeoutLanguages }
  );
  return response.data;
};

module.exports = {
  fetchLanguages,
  submitCode,
  fetchSubmission // ✨ NEW
};
