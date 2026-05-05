/**
 * ============================================================================
 * CLASS CONTROLLER - ADMIN
 * ============================================================================
 * 
 * Handles HTTP requests for class management.
 * 
 * Responsibilities:
 * - Extract request data (params, body)
 * - Call class service methods
 * - Transform and return responses
 * - Pass errors to global error handler
 * 
 * Class Structure:
 * - Name, grade, section (e.g., "Year 1 A")
 * - Multiple teachers per class
 * - Each teacher assigned to specific subject
 * - Timetable with daily schedule
 * - List of enrolled students
 */

const classService = require('../services/classService');

/**
 * Get all active classes
 * 
 * Route: GET /api/classes
 * 
 * Returns: All class records with teacher assignments
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "60d5ec49...",
 *       "name": "Year 1 A",
 *       "grade": "1",
 *       "section": "A",
 *       "teachers": [...],
 *       "studentCount": 35
 *     }
 *   ]
 * }
 * 
 * @async
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Error handler
 */
const getAllClasses = async (req, res, next) => {
  try { 
    res.json({ success: true, data: await classService.getAllClasses() }); 
  }
  catch (err) { next(err); }
};

/**
 * Get specific class by ID
 * 
 * Route: GET /api/classes/:id
 * 
 * Returns: Detailed class information
 * 
 * Response includes:
 * - Class details
 * - All assigned teachers with subjects
 * - Timetable
 * - Student count
 * 
 * @async
 * @param {Object} req - Express request
 * @param {string} req.params.id - Class ID
 * @param {Object} res - Express response
 * @param {Function} next - Error handler
 * 
 * @example
 * GET /api/classes/60d5ec49c1234567890abcd1
 */
const getClass = async (req, res, next) => {
  try { 
    res.json({ success: true, data: await classService.getClassById(req.params.id) }); 
  }
  catch (err) { next(err); }
};

/**
 * Create new class
 * 
 * Route: POST /api/classes
 * Middleware: adminOnly (admin only)
 * 
 * Request body:
 * {
 *   "name": "Year 1 A",
 *   "grade": "1",
 *   "section": "A"
 * }
 * 
 * Response (201 Created):
 * {
 *   "success": true,
 *   "data": { "id": "...", "name": "Year 1 A", ... }
 * }
 * 
 * @async
 * @param {Object} req - Express request
 * @param {Object} req.body - Class data
 * @param {Object} res - Express response
 * @param {Function} next - Error handler
 */
const createClass = async (req, res, next) => {
  try { 
    res.status(201).json({ 
      success: true, 
      data: await classService.createClass(req.body) 
    }); 
  }
  catch (err) { next(err); }
};

/**
 * Update class information
 * 
 * Route: PUT /api/classes/:id
 * Middleware: adminOnly
 * 
 * Can update:
 * - Name, grade, section
 * - Class status
 * 
 * @async
 * @param {Object} req - Express request
 * @param {string} req.params.id - Class ID
 * @param {Object} req.body - Fields to update
 * @param {Object} res - Express response
 * @param {Function} next - Error handler
 */
const updateClass = async (req, res, next) => {
  try { 
    res.json({ 
      success: true, 
      data: await classService.updateClass(req.params.id, req.body) 
    }); 
  }
  catch (err) { next(err); }
};

/**
 * Assign a teacher to a class for a specific subject
 * 
 * Route: POST /api/classes/:id/teachers
 * Middleware: adminOnly
 * 
 * Workflow:
 * 1. Receive teacherId and subject
 * 2. Verify teacher exists
 * 3. Verify class exists
 * 4. Create teacher assignment
 * 5. Add to class.teachers array
 * 6. Add to teacher.assignedClasses array
 * 
 * Teacher Assignment:
 * - One teacher can teach multiple classes
 * - One class can have multiple teachers
 * - Each teacher assignment has specific subject
 * 
 * Request body:
 * {
 *   "teacherId": "60d5ec49...",
 *   "subject": "Mathematics"
 * }
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Teacher assigned to Mathematics",
 *   "data": { updated class }
 * }
 * 
 * @async
 * @param {Object} req - Express request
 * @param {string} req.params.id - Class ID
 * @param {Object} req.body - { teacherId, subject }
 * @param {Object} res - Express response
 * @param {Function} next - Error handler
 * 
 * @example
 * POST /api/classes/60d5ec49.../teachers
 * {
 *   "teacherId": "60d5ec50...",
 *   "subject": "English"
 * }
 */
const assignTeacher = async (req, res, next) => {
  try {
    const { teacherId, subject } = req.body;
    const data = await classService.assignTeacher(req.params.id, teacherId, subject);
    res.json({ 
      success: true, 
      message: `Teacher assigned to ${subject}`, 
      data 
    });
  } catch (err) { next(err); }
};

/**
 * Remove a teacher from a subject in a class
 * 
 * Route: DELETE /api/classes/:id/teachers
 * Middleware: adminOnly
 * 
 * Request body:
 * {
 *   "subject": "Mathematics"
 * }
 * 
 * Workflow:
 * 1. Find class
 * 2. Find and remove teacher assignment for subject
 * 3. Remove class from teacher.assignedClasses
 * 4. Return updated class
 * 
 * @async
 * @param {Object} req - Express request
 * @param {string} req.params.id - Class ID
 * @param {Object} req.body - { subject }
 * @param {Object} res - Express response
 * @param {Function} next - Error handler
 */
const removeTeacher = async (req, res, next) => {
  try {
    const data = await classService.removeTeacher(req.params.id, req.body.subject);
    res.json({ 
      success: true, 
      message: 'Teacher removed', 
      data 
    });
  } catch (err) { next(err); }
};

/**
 * Update class timetable
 * 
 * Route: PUT /api/classes/:id/timetable
 * Middleware: adminOnly
 * 
 * Timetable Format:
 * [
 *   { day: "Monday", periods: [ { period: 1, subject: "Math", startTime: "09:00", endTime: "10:00" } ] },
 *   { day: "Tuesday", periods: [...] }
 * ]
 * 
 * @async
 * @param {Object} req - Express request
 * @param {string} req.params.id - Class ID
 * @param {Array} req.body.timetable - New timetable
 * @param {Object} res - Express response
 * @param {Function} next - Error handler
 */
const updateTimetable = async (req, res, next) => {
  try { 
    res.json({ 
      success: true, 
      data: await classService.updateTimetable(req.params.id, req.body.timetable) 
    }); 
  }
  catch (err) { next(err); }
};

/**
 * Get all available teachers
 * 
 * Route: GET /api/teachers
 * 
 * Returns: List of all staff that can be assigned to classes
 * 
 * Use Case: Dropdown in teacher assignment form
 * 
 * @async
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Error handler
 */
const getTeachers = async (req, res, next) => {
  try { 
    res.json({ success: true, data: await classService.getTeachers() }); 
  }
  catch (err) { next(err); }
};

module.exports = { 
  getAllClasses, 
  getClass, 
  createClass, 
  updateClass, 
  assignTeacher, 
  removeTeacher, 
  updateTimetable, 
  getTeachers 
};
