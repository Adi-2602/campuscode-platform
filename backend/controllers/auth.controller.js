const {
  registerUser,
  loginUser
} = require("../services/auth.service");

/**
 * Register (Student / Teacher)
 * 🔥 MODIFIED: Additional validation to block admin/superadmin registration
 */
const register = async (req, res) => {
  try {
    const { name, email, rollNo, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        error: "name, email, password and role are required"
      });
    }

    // 🔥 NEW: Explicitly block admin and superadmin roles
    if (role === "admin" || role === "superadmin") {
      return res.status(403).json({
        error: "Cannot register as admin or superadmin. Only student and teacher roles are allowed.",
        allowedRoles: ["student", "teacher"]
      });
    }

    // 🔥 NEW: Validate role is either student or teacher
    if (role !== "student" && role !== "teacher") {
      return res.status(400).json({
        error: "Invalid role. Allowed roles: student, teacher",
        allowedRoles: ["student", "teacher"]
      });
    }

    const user = await registerUser({
      name,
      email,
      rollNo,
      password,
      role
    });

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Login
 * 🔥 MODIFIED: Return permissions for admin users
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "email and password are required"
      });
    }

    const data = await loginUser({ email, password });

    res.json({
      message: "Login successful",
      token: data.token,
      user: data.user // 🔥 Now includes permissions for admin
    });
  } catch (error) {
    res.status(401).json({
      error: error.message
    });
  }
};

module.exports = {
  register,
  login
};