module.exports = {
  baseURL: process.env.JUDGE0_URL,
  // Only needed for the hosted RapidAPI Judge0 (leave empty for self-hosted)
  apiKey: process.env.JUDGE0_API_KEY,
  apiHost: process.env.JUDGE0_API_HOST || "judge0-ce.p.rapidapi.com",
  timeoutLanguages: 10000,
  timeoutSubmission: 20000
};
