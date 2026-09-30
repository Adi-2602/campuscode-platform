const {
  fetchLanguages,
  submitCode,
  fetchSubmission // ✨ NEW
} = require("../services/judge0.service");

// ... existing getLanguages ...

// 2️⃣ Run code (Async: Returns Token)
const runSubmission = async (req, res) => {
  try {
    const { language_id, source_code, stdin } = req.body;

    if (!language_id || !source_code) {
      return res.status(400).json({
        error: "language_id and source_code are required"
      });
    }

    // Returns { token: "..." }
    const result = await submitCode({
      language_id,
      source_code,
      stdin
    });

    res.json(result); // Sent token to frontend

  } catch (err) {
    console.error("Execution error:", err.response?.data || err.message);
    res.status(500).json({ error: "Execution failed" });
  }
};

// Helper to safely decode Base64
const decodeBase64 = (str) => {
  if (!str) return "";
  try {
    return Buffer.from(str, "base64").toString("utf-8");
  } catch (e) {
    return str;
  }
};

// 3️⃣ ✨ NEW: Get Submission Result (Polling Endpoint)
const getSubmissionResult = async (req, res) => {
  try {
    const { token } = req.params;
    const result = await fetchSubmission(token);

    // Check status
    // status.id === 1 (In Queue) or 2 (Processing)
    if (result.status?.id <= 2) {
      return res.json({
        status: "Processing",
        message: "Code is still running..."
      });
    }

    res.json({
      stdout: decodeBase64(result.stdout), // ✨ DECODED
      stderr: decodeBase64(result.stderr), // ✨ DECODED
      compile_output: decodeBase64(result.compile_output), // ✨ DECODED
      status: result.status?.description,
      time: result.time,
      memory: result.memory
    });

  } catch (err) {
    console.error("Fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch result" });
  }
};

// 1️⃣ Get Judge0 languages
const getLanguages = async (req, res) => {
  try {
    const languages = await fetchLanguages();
    res.json(languages);
  } catch (err) {
    console.error("Languages error:", err.message);
    res.status(500).json({ error: "Failed to fetch languages" });
  }
};

module.exports = {
  getLanguages,
  runSubmission,
  getSubmissionResult // ✨ NEW
};
