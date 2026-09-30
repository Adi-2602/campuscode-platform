const express = require("express");
const {
  register,
  login
} = require("../controllers/auth.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user registration
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new student or teacher account. Admin and superadmin roles cannot be created through this endpoint. Teachers require verification from superadmin before they can create classes/exams.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *                 description: Full name of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *                 description: Email address (must be unique)
 *               rollNo:
 *                 type: string
 *                 example: "CS2024001"
 *                 description: Student roll number (optional, for students only)
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123!"
 *                 description: Password (minimum 6 characters recommended)
 *               role:
 *                 type: string
 *                 enum: [student, teacher]
 *                 example: "student"
 *                 description: User role (only student or teacher allowed)
 *           examples:
 *             studentRegistration:
 *               summary: Register as student
 *               value:
 *                 name: "Alice Johnson"
 *                 email: "alice.johnson@student.edu"
 *                 rollNo: "CS2024001"
 *                 password: "StudentPass123!"
 *                 role: "student"
 *             teacherRegistration:
 *               summary: Register as teacher
 *               value:
 *                 name: "Dr. Robert Smith"
 *                 email: "robert.smith@university.edu"
 *                 password: "TeacherPass123!"
 *                 role: "teacher"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Registration successful"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "6979938b0b2d55e2878d7462"
 *                     name:
 *                       type: string
 *                       example: "Alice Johnson"
 *                     email:
 *                       type: string
 *                       example: "alice.johnson@student.edu"
 *                     role:
 *                       type: string
 *                       example: "student"
 *                     isVerified:
 *                       type: boolean
 *                       example: false
 *                       description: Teachers start as unverified
 *       400:
 *         description: Invalid input or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   examples:
 *                     - "User with this email already exists"
 *                     - "name, email, password and role are required"
 *                     - "Invalid role. Allowed roles: student, teacher"
 *       403:
 *         description: Forbidden (trying to register as admin/superadmin)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Cannot register as admin or superadmin. Only student and teacher roles are allowed."
 *                 allowedRoles:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["student", "teacher"]
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user with email and password. Returns JWT token for API access. Token should be included in Authorization header as "Bearer <token>" for protected routes.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "alice.johnson@student.edu"
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "StudentPass123!"
 *                 description: User's password
 *           examples:
 *             studentLogin:
 *               summary: Student login
 *               value:
 *                 email: "alice.johnson@student.edu"
 *                 password: "StudentPass123!"
 *             teacherLogin:
 *               summary: Teacher login
 *               value:
 *                 email: "robert.smith@university.edu"
 *                 password: "TeacherPass123!"
 *             adminLogin:
 *               summary: Admin login
 *               value:
 *                 email: "admin@system.com"
 *                 password: "AdminPass123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   description: JWT token for authentication
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "6979938b0b2d55e2878d7462"
 *                     name:
 *                       type: string
 *                       example: "Alice Johnson"
 *                     email:
 *                       type: string
 *                       example: "alice.johnson@student.edu"
 *                     role:
 *                       type: string
 *                       example: "student"
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Only included for admin users
 *                       example: ["VIEW_CLASSES", "VIEW_STUDENTS"]
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid email or password"
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "email and password are required"
 */
router.post("/login", login);

module.exports = router;