/**
 * ============================================================================
 * STUDENT CONTROLLER - ADMIN
 * ============================================================================
 * 
 * Handles HTTP requests for student management.
 * 
 * Responsibilities:
 * - Extract request parameters and body
 * - Pass user context to services (for RBAC)
 * - Call student service methods
 * - Format and return responses
 * - Delegate error handling
 * 
 * Key Pattern: Pass req.user to services
 * - Services need user context for:
 *   - Permission checking (teachers limited to own classes)
 *   - Audit logging (who made the change)
 *   - Notifications (email to affected users)
 */

const studentService = require('../services/studentService');

/**
 * Get all students (with teacher scope filtering)
 * 
 * Route: GET /api/students?classId=...
 * Middleware: requireAuth (any authenticated user)
 * 
 * Features:
 * - Teachers see only their assigned classes
 * - Admins see all students
 * - Filter by classId if provided
 * 
 * Request Query:
 * - classId (optional): Filter by specific class
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "data": [ { id, firstName, lastName, studentCode, class, ... } ]
 * }
 * 
 * @async
 * @param {Object} req - Express request
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.classId - Optional class filter
 * @param {Object} req.user - Authenticated user (from auth middleware)
 * @param {string} req.user.role - User role (admin/teacher)
 * @param {Array} req.user.assignedClasses - For teachers
 * @param {Object} res - Express response
 * @param {Function} next - Error handler
 * 
 * @example
 * // Get all students (admin)
 * GET /api/students
 * 
 * // Filter by class
 * GET /api/students?classId=60d5ec50...
 */
const getAllStudents = async (req, res, next) => {
  try {
    // Pass req.user so service can apply RBAC filters
    const data = await studentService.getAllStudents(req.query, req.user);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

/**
 * Get specific student by ID
 * 
 * Route: GET /api/students/:id
 * 
 * Returns: Complete student profile including grades and attendance
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "60d5ec49...",
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "grades": [ { subject, score, grade, term, updatedBy, updatedAt } ],
 *     "attendance": [ { date, status, markedBy } ],
 *     "class": { id, name, grade, section }
 *   }
 * }
 * 
 * @async
 * @param {Object} req - Express request
 * @param {string} req.params.id - Student ID
 * @param {Object} res - Express response
 * @param {Function} next - Error handler
 */
const getStudent = async (req, res, next) => {
  try {
    const student = await studentService.getStudentById(req.params.id);
    res.json({ success: true, data: student });
  } catch (err) { next(err); }
};

/**
 * Create new student record
 * 
 * Route: POST /api/students
 * Middleware: adminOnly
 * 
 * Request body:
 * {
 *   "firstName": "Alice",
 *   "lastName": "Johnson",
 *   "studentCode": "STU102",
 *   "class": "60d5ec50...",
 *   "dateOfBirth": "2010-05-15",
 *   "gender": "female"
 * }
 * 
 * Response (201 Created):
 * {
 *   "success": true,
 *   "data": { created student }
 * }
 * 
 * @async
 * @param {Object} req - Express request
 * @param {Object} req.body - Student data
 * @param {Object} res - Express response
 * @param {Function} next - Error handler
 */
const createStudent = async (req, res, next) => {
  try {
    const data = await studentService.createStudent(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

/**
 * Update student information
 * 
 * Route: PUT /api/students/:id
 * Middleware: adminOnly
 * 
 * Can update:
 * - Name, DOB, gender
 * - Class assignment
 * - Active status
 * 
 * @async
 * @param {Object} req - Express request
 * @param {string} req.params.id - Student ID
 * @param {Object} req.body - Fields to update
 * @param {Object} res - Express response
 * @param {Function} next - Error handler
 */
const updateStudent = async (req, res, next) => {
  try {
    const data = await studentService.updateStudent(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

/**
 * Update student grades
 * 
 * Route: PUT /api/students/:id/grades
 * Middleware: requireAuth, staffOnly (admins and teachers)
 * 
 * Workflow:
 * 1. Teacher/admin submits grades for one or more subjects
 * 2. Service checks if teacher assigned to student's class
 * 3. Grades updated or created
 * 4. Audit logged
 * 5. Email notification sent
 * 
 * Request body:
 * {
 *   "grades": [
 *     { "subject": "Math", "score": 85, "grade": "A", "term": "Term 1" },
 *     { "subject": "English", "score": 90, "grade": "A", "term": "Term 1" }
 *   ]
 * }
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "data": [ { subject, score, grade, term, updatedBy, updatedAt } ]
 * }
 * 
 * RBAC:
 * - Admins can update any student
 * - Teachers can only update their assigned classes
 * 
 * Audit Trail:
 * - Records who updated
 * - Before/after grade values
 * - Timestamp
 * 
 * @async
 * @param {Object} req - Express request
 * @param {string} req.params.id - Student ID
 * @param {Object} req.body - { grades: [...] }
 * @param {Object} req.user - Authenticated user (passed to service)
 * @param {Object} res - Express response
 * @param {Function} next - Error handler
 * 
 * @example
 * PUT /api/students/60d5ec49.../grades
 * Authorization: Bearer {token}
 * 
 * {
 *   "grades": [
 *     { "subject": "Mathematics", "score": 88, "grade": "B+", "term": "Term 1" }
 *   ]
 * }
 */
const updateGrades = async (req, res, next) => {
  try {
    // Pass full user object for scope check + audit log
    const data = await studentService.updateGrades(req.params.id, req.body.grades, req.user);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

/**
 * Mark attendance for single student
 * 
 * Route: PUT /api/students/:id/attendance
 * Middleware: staffOnly
 * 
 * Request body:
 * {
 *   "records": [
 *     { "date": "2024-01-15", "status": "present" },
 *     { "date": "2024-01-16", "status": "late" }
 *   ]
 * }
 * 
 * Status values: present, absent, late, excused
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "data": [ { date, status, markedBy } ]
 * }
 * 
 * @async
 * @param {Object} req - Express request
 * @param {string} req.params.id - Student ID
 * @param {Object} req.body - { records: [...] }
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response
 * @param {Function} next - Error handler
 */
const markAttendance = async (req, res, next) => {
  try {
    const data = await studentService.markAttendance(req.params.id, req.body.records, req.user);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

/**
 * Mark attendance for entire class at once
 * 
 * Route: POST /api/attendance/bulk
 * Middleware: staffOnly
 * 
 * Workflow:
 * 1. Get all students in class
 * 2. Apply default status to all
 * 3. Apply individual overrides if provided
 * 4. Update all in parallel
 * 5. Log bulk action
 * 
 * Request body:
 * {
 *   "classId": "60d5ec50...",
 *   "date": "2024-01-15",
 *   "defaultStatus": "present",
 *   "overrides": [
 *     { "studentId": "60d5ec49...", "status": "absent" },
 *     { "studentId": "60d5ec50...", "status": "late" }
 *   ]
 * }
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Attendance marked for 35 students.",
 *   "data": { "marked": 35, "date": "2024-01-15", "classId": "..." }
 * }
 * 
 * Performance: Uses Promise.all for parallel updates
 * 
 * @async
 * @param {Object} req - Express request
 * @param {Object} req.body - Attendance data
 * @param {string} req.body.classId - Class ID
 * @param {string} req.body.date - ISO date
 * @param {string} req.body.defaultStatus - Status for all students
 * @param {Array} req.body.overrides - Individual overrides
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response
 * @param {Function} next - Error handler
 * 
 * @example
 * POST /api/attendance/bulk
 * {
 *   "classId": "60d5ec50...",
 *   "date": "2024-01-15",
 *   "defaultStatus": "present",
 *   "overrides": [{ "studentId": "...", "status": "absent" }]
 * }
 */
const bulkMarkAttendance = async (req, res, next) => {
  try {
    const { classId, date, defaultStatus, overrides } = req.body;
    const data = await studentService.bulkMarkAttendance(
      classId, 
      date, 
      defaultStatus, 
      overrides, 
      req.user
    );
    res.json({ 
      success: true, 
      message: `Attendance marked for ${data.marked} students.`, 
      data 
    });
  } catch (err) { next(err); }
};

/**
 * Promote students from one class to another
 * 
 * Route: POST /api/students/promote
 * Middleware: adminOnly
 * 
 * End-of-year operation to move students up a grade.
 * 
 * Request body:
 * {
 *   "fromClassId": "60d5ec50...",
 *   "toClassId": "60d5ec51..."
 * }
 * 
 * Example:
 * - Move all students from "Year 1 A" to "Year 2 A"
 * - Updates class assignment for all active students
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "message": "35 students promoted from Year 1 A to Year 2 A.",
 *   "data": {
 *     "promoted": 35,
 *     "fromClass": "Year 1 A",
 *     "toClass": "Year 2 A"
 *   }
 * }
 * 
 * @async
 * @param {Object} req - Express request
 * @param {Object} req.body - { fromClassId, toClassId }
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response
 * @param {Function} next - Error handler
 */
const promoteStudents = async (req, res, next) => {
  try {
    const { fromClassId, toClassId } = req.body;
    const data = await studentService.promoteStudents(fromClassId, toClassId, req.user);
    res.json({ 
      success: true, 
      message: `${data.promoted} students promoted from ${data.fromClass} to ${data.toClass}.`, 
      data 
    });
  } catch (err) { next(err); }
};

/**
 * Link student record to user account
 * 
 * Route: POST /api/students/:id/link
 * Middleware: adminOnly
 * 
 * Workflow:
 * 1. Find student by ID
 * 2. Find user account by email
 * 3. Create bidirectional link
 * 4. Add student to parent's children array (if parent)
 * 
 * Result:
 * - Student can now login via user account
 * - Parent can view academic info
 * - Grades/attendance visible in client portal
 * 
 * Request body:
 * {
 *   "email": "parent@email.com"
 * }
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Account linked successfully",
 *   "data": { updated student }
 * }
 * 
 * @async
 * @param {Object} req - Express request
 * @param {string} req.params.id - Student ID
 * @param {Object} req.body - { email }
 * @param {Object} res - Express response
 * @param {Function} next - Error handler
 */
const linkUserAccount = async (req, res, next) => {
  try {
    const data = await studentService.linkUserAccount(req.params.id, req.body.email);
    res.json({ 
      success: true, 
      message: 'Account linked successfully', 
      data 
    });
  } catch (err) { next(err); }
};

/**
 * Send an invite link for registration and auto-linking to a student record.
 *
 * Route: POST /api/students/:id/send-invite
 * Middleware: adminOnly
 */
const sendRegistrationInvite = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const data = await studentService.createRegistrationInvite(req.params.id, email, role, req.user);
    res.json({
      success: true,
      message: 'Registration invite created and sent.',
      data,
    });
  } catch (err) { next(err); }
};

/**
 * Get users without linked student accounts
 * 
 * Route: GET /api/students/unlinked
 * Middleware: adminOnly
 * 
 * Returns: Users that haven't been linked to student records yet
 * 
 * Use Case: Admin selects from list when linking accounts
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "60d5ec49...",
 *       "name": "John Doe",
 *       "email": "john@email.com",
 *       "role": "parent"
 *     }
 *   ]
 * }
 * 
 * @async
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Error handler
 */
const getUnlinkedUsers = async (req, res, next) => {
  try {
    const data = await studentService.getUnlinkedUsers();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = {
  getAllStudents, 
  getStudent, 
  createStudent, 
  updateStudent,
  updateGrades, 
  markAttendance, 
  bulkMarkAttendance, 
  promoteStudents,
  linkUserAccount, 
  sendRegistrationInvite,
  getUnlinkedUsers,
};
