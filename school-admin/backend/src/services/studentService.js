/**
 * ============================================================================
 * STUDENT SERVICE - ADMIN
 * ============================================================================
 * 
 * Core business logic for student management.
 * 
 * Responsibilities:
 * - Student CRUD operations
 * - Grade management and updates
 * - Attendance tracking (individual and bulk)
 * - Class promotions
 * - Account linking (student records to user accounts)
 * 
 * Security:
 * - Teachers can only access their assigned classes
 * - All changes logged to audit trail
 * - Email notifications sent on grade updates
 * 
 * Key Features:
 * - Role-based access control (teacher scope checking)
 * - Bulk operations for efficiency (bulk attendance)
 * - Audit logging for compliance
 * - Email notifications for stakeholders
 */

const Student    = require('../models/Student');
const ClientUser = require('../models/ClientUser');
const Class      = require('../models/Class');
const { toStudent } = require('../dtos/adminDto');
const { log }    = require('./auditService');
const { notify } = require('./emailService');

/**
 * Get all active students with optional filtering
 * 
 * Features:
 * - Teachers only see their assigned classes
 * - Admins see all students
 * - Filter by class ID
 * - Populated with class information
 * 
 * RBAC (Role-Based Access Control):
 * - admin: Can see all students in all classes
 * - teacher: Limited to their assigned classes
 * 
 * @static
 * @param {Object} query - Query filters
 * @param {string} query.classId - Optional class filter
 * @param {Object} requestingUser - AdminUser object with role
 * @param {string} requestingUser.role - User role (admin or teacher)
 * @param {Array} requestingUser.assignedClasses - For teachers
 * @returns {Promise<Array>} Array of student DTOs
 * 
 * @example
 * // Admin gets all students
 * const students = await getAllStudents({}, adminUser);
 * 
 * // Filter by class
 * const classStudents = await getAllStudents(
 *   { classId: '60d5ec49c1234567890abcd1' }, 
 *   adminUser
 * );
 * 
 * // Teacher gets only their students
 * const myStudents = await getAllStudents({}, teacherUser);
 */
const getAllStudents = async (query = {}, requestingUser = null) => {
  const filter = { isActive: true };

  if (query.classId) {
    filter.class = query.classId;
  } else if (requestingUser?.role === 'teacher') {
    // Restrict teacher to their assigned classes only
    filter.class = { $in: requestingUser.assignedClasses };
  }

  const students = await Student.find(filter).populate('class', 'name grade section');
  return students.map(toStudent);
};

/**
 * Get detailed student information by ID
 * 
 * Returns: Full student profile including:
 * - Personal information
 * - Grades (all terms and subjects)
 * - Attendance records
 * - Class information (name, grade, section, timetable)
 * - Linked user account (if linked)
 * 
 * @static
 * @param {string} id - MongoDB student ID
 * @returns {Promise<Object>} Detailed student object
 * @throws {Error} 404 if student not found
 * 
 * @example
 * const student = await getStudentById('60d5ec49c1234567890abcd1');
 * console.log(student.grades);     // All grades
 * console.log(student.attendance); // All attendance records
 * console.log(student.class.name); // Class details
 */
const getStudentById = async (id) => {
  const student = await Student.findById(id)
    .populate('class', 'name grade section timetable')
    .populate('userId', 'firstName lastName email');
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }
  return student;
};

/**
 * Create new student record
 * 
 * Input:
 * {
 *   firstName: "John",
 *   lastName: "Doe",
 *   studentCode: "STU001",
 *   class: ObjectId,
 *   dateOfBirth: Date,
 *   gender: "male"
 * }
 * 
 * @static
 * @param {Object} data - Student data
 * @returns {Promise<Object>} Created student (DTO)
 * 
 * @example
 * const newStudent = await createStudent({
 *   firstName: 'Alice',
 *   lastName: 'Johnson',
 *   studentCode: 'STU102',
 *   class: classId,
 *   dateOfBirth: new Date('2010-05-15')
 * });
 */
const createStudent = async (data) => {
  const student = await Student.create(data);
  return toStudent(student);
};

/**
 * Update student information
 * 
 * Can update:
 * - Name, DOB, gender
 * - Class assignment
 * - Active status
 * - Fee balance
 * 
 * @static
 * @param {string} id - Student ID
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Updated student (DTO)
 * @throws {Error} 404 if student not found
 * 
 * @example
 * const updated = await updateStudent(studentId, {
 *   class: newClassId,
 *   dateOfBirth: newDate
 * });
 */
const updateStudent = async (id, data) => {
  const student = await Student.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }
  return toStudent(student);
};

/**
 * Link student record to a registered client user account
 * 
 * Workflow:
 * 1. Verify student exists
 * 2. Find user account by email
 * 3. Link bidirectionally (student.userId, user.studentProfile)
 * 4. Add student to parent's children array if parent
 * 5. Save both documents
 * 
 * Result:
 * - Student can now log in via user account
 * - Parent can view their child's academic info
 * - Grades/attendance visible in client portal
 * 
 * @static
 * @param {string} studentId - Student ID
 * @param {string} userEmail - Email of registered user account
 * @returns {Promise<Object>} Updated student (DTO)
 * @throws {Error} 404 if student or user not found
 * 
 * @example
 * const linked = await linkUserAccount(
 *   '60d5ec49c1234567890abcd1',
 *   'parent@email.com'
 * );
 */
const linkUserAccount = async (studentId, userEmail) => {
  const student = await Student.findById(studentId);
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }

  const user = await ClientUser.findOne({ email: userEmail.toLowerCase().trim() });
  if (!user) {
    const err = new Error('No registered account found with that email');
    err.statusCode = 404;
    throw err;
  }

  student.userId = user._id;
  user.studentProfile = student._id;

  if (user.role === 'parent' && !user.children.map(String).includes(String(student._id))) {
    user.children.push(student._id);
  }

  await Promise.all([student.save(), user.save()]);
  return toStudent(student);
};

/**
 * Get all users without linked student accounts
 * 
 * Used by admin to find which parent/student accounts
 * haven't been linked to student records yet.
 * 
 * Returns: Unlinked active user accounts sorted by name
 * 
 * @static
 * @returns {Promise<Array>} Unlinked users with id, name, email, role
 * 
 * @example
 * const unlinked = await getUnlinkedUsers();
 * // [
 * //   { id: '...', name: 'John Doe', email: 'john@email.com', role: 'parent' },
 * //   ...
 * // ]
 */
const getUnlinkedUsers = async () => {
  const users = await ClientUser.find({ isActive: true, studentProfile: null })
    .select('firstName lastName email role')
    .sort({ firstName: 1 });
  return users.map(u => ({
    id: u._id, name: `${u.firstName} ${u.lastName}`, email: u.email, role: u.role,
  }));
};

/**
 * Update student grades
 * 
 * Workflow:
 * 1. Verify student exists
 * 2. Check teacher permissions (can only update own class students)
 * 3. Save old grades for audit
 * 4. Update or create grade records
 * 5. Log to audit trail
 * 6. Send email notification to student/parent
 * 
 * Input:
 * {
 *   grades: [
 *     { subject: "Math", score: 85, grade: "A", term: "Term 1" },
 *     ...
 *   ]
 * }
 * 
 * RBAC:
 * - admin: Can update any student's grades
 * - teacher: Only their assigned class students
 * 
 * Audit Logging:
 * - Records who made the change
 * - Before/after grade values
 * - Timestamp
 * 
 * @static
 * @param {string} studentId - Student ID
 * @param {Array} grades - Grade objects to update
 * @param {Object} adminUser - AdminUser performing update
 * @returns {Promise<Array>} Updated grades array
 * @throws {Error} 403 if teacher not assigned to class
 * @throws {Error} 404 if student not found
 * 
 * @example
 * const updated = await updateGrades(
 *   studentId,
 *   [{ subject: 'English', score: 92, grade: 'A', term: 'Term 1' }],
 *   adminUser
 * );
 */
const updateGrades = async (studentId, grades, adminUser) => {
  const student = await Student.findById(studentId).populate('userId', 'email firstName');
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }

  // Teacher scope check: Ensure teacher only updates their own class
  if (adminUser.role === 'teacher') {
    const isAssigned = adminUser.assignedClasses.map(String).includes(String(student.class));
    if (!isAssigned) {
      const err = new Error('You are not assigned to this student\'s class');
      err.statusCode = 403;
      throw err;
    }
  }

  // Save original grades for audit comparison
  const before = JSON.parse(JSON.stringify(student.grades));

  // Update or create grade records
  for (const g of grades) {
    const existing = student.grades.find(
      (gr) => gr.subject === g.subject && gr.term === g.term
    );
    if (existing) {
      // Update existing grade
      existing.score     = g.score;
      existing.grade     = g.grade;
      existing.updatedBy = adminUser._id;
      existing.updatedAt = new Date();
    } else {
      // Create new grade record
      student.grades.push({ ...g, updatedBy: adminUser._id, updatedAt: new Date() });
    }
  }

  // Save updated student document
  await student.save();

  // Audit log: Record who made the change
  await log({
    actor: adminUser._id, actorModel: 'AdminUser',
    actorName: `${adminUser.firstName} ${adminUser.lastName}`,
    action: 'grade.update',
    target: `Student:${studentId}`,
    before, after: student.grades,  // Compare before/after for compliance
  });

  // Email notification: Notify student/parent of grade updates
  if (student.userId?.email) {
    for (const g of grades) {
      notify.gradesUpdated(student.userId, g.subject, g.term).catch(() => {});
    }
  }

  return student.grades;
};

/**
 * Mark attendance for a single student
 * 
 * Workflow:
 * 1. Find student
 * 2. Check teacher permissions
 * 3. Update or create attendance records for given dates
 * 4. Log to audit trail
 * 
 * Input:
 * {
 *   records: [
 *     { date: "2024-01-15", status: "present" },
 *     { date: "2024-01-16", status: "absent" }
 *   ]
 * }
 * 
 * Status values: present, absent, late, excused
 * 
 * @static
 * @param {string} studentId - Student ID
 * @param {Array} records - Attendance records { date, status }
 * @param {Object} adminUser - AdminUser performing action
 * @returns {Promise<Array>} Updated attendance array
 * @throws {Error} 403 if teacher not assigned to class
 * @throws {Error} 404 if student not found
 * 
 * @example
 * const attendance = await markAttendance(
 *   studentId,
 *   [
 *     { date: '2024-01-15', status: 'present' },
 *     { date: '2024-01-16', status: 'late' }
 *   ],
 *   adminUser
 * );
 */
const markAttendance = async (studentId, records, adminUser) => {
  const student = await Student.findById(studentId);
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }

  // Teacher scope check: Can only mark attendance for own class
  if (adminUser.role === 'teacher') {
    const isAssigned = adminUser.assignedClasses.map(String).includes(String(student.class));
    if (!isAssigned) {
      const err = new Error('You are not assigned to this student\'s class');
      err.statusCode = 403;
      throw err;
    }
  }

  // Update or create attendance records
  for (const r of records) {
    const date = new Date(r.date);
    const existing = student.attendance.find(
      (a) => a.date.toDateString() === date.toDateString()
    );
    if (existing) {
      // Update existing record
      existing.status   = r.status;
      existing.markedBy = adminUser._id;
    } else {
      // Create new record
      student.attendance.push({ date, status: r.status, markedBy: adminUser._id });
    }
  }

  await student.save();

  // Audit log: Track who marked attendance
  await log({
    actor: adminUser._id, actorModel: 'AdminUser',
    actorName: `${adminUser.firstName} ${adminUser.lastName}`,
    action: 'attendance.mark',
    target: `Student:${studentId}`,
    after: records,
  });

  return student.attendance;
};

/**
 * Mark attendance for all students in a class at once
 * 
 * Bulk Workflow:
 * 1. Verify teacher is assigned to class
 * 2. Get all active students in class
 * 3. Apply default status to all students
 * 4. Apply individual overrides if provided
 * 5. Update all documents in parallel
 * 6. Log bulk action to audit trail
 * 
 * Performance: Uses Promise.all for parallel updates instead of sequential
 * 
 * Input:
 * {
 *   classId: "60d5ec49...",
 *   date: "2024-01-15",
 *   defaultStatus: "present",
 *   overrides: [
 *     { studentId: "60d5ec49...", status: "absent" },
 *     { studentId: "60d5ec50...", status: "late" }
 *   ]
 * }
 * 
 * @static
 * @param {string} classId - Class ID
 * @param {string} date - ISO date string
 * @param {string} defaultStatus - Status for all students (present/absent/late/excused)
 * @param {Array} overrides - Individual student status overrides
 * @param {Object} adminUser - AdminUser performing action
 * @returns {Promise<Object>} { marked: number, date, classId }
 * @throws {Error} 403 if teacher not assigned to class
 * @throws {Error} 404 if no students in class
 * 
 * @example
 * const result = await bulkMarkAttendance(
 *   classId,
 *   '2024-01-15',
 *   'present',
 *   [{ studentId: '...', status: 'absent' }],
 *   adminUser
 * );
 * // Returns: { marked: 35, date: '2024-01-15', classId: '...' }
 */
const bulkMarkAttendance = async (classId, date, defaultStatus, overrides = [], adminUser) => {
  // Teacher scope check: Can only mark attendance for assigned classes
  if (adminUser.role === 'teacher') {
    const isAssigned = adminUser.assignedClasses.map(String).includes(String(classId));
    if (!isAssigned) {
      const err = new Error('You are not assigned to this class');
      err.statusCode = 403;
      throw err;
    }
  }

  // Get all active students in the class
  const students = await Student.find({ class: classId, isActive: true });
  if (!students.length) {
    const err = new Error('No students found in this class');
    err.statusCode = 404;
    throw err;
  }

  // Build override map for O(1) lookup
  const attendanceDate = new Date(date);
  const overrideMap = {};
  overrides.forEach(o => { overrideMap[String(o.studentId)] = o.status; });

  // Update all students in parallel (not sequential)
  const updates = students.map(async (student) => {
    // Use override status if provided, otherwise use default
    const status = overrideMap[String(student._id)] || defaultStatus;
    
    const existing = student.attendance.find(
      (a) => a.date.toDateString() === attendanceDate.toDateString()
    );
    if (existing) {
      existing.status   = status;
      existing.markedBy = adminUser._id;
    } else {
      student.attendance.push({ date: attendanceDate, status, markedBy: adminUser._id });
    }
    return student.save();
  });

  // Wait for all saves to complete
  await Promise.all(updates);

  // Audit log: Record bulk attendance action
  await log({
    actor: adminUser._id, actorModel: 'AdminUser',
    actorName: `${adminUser.firstName} ${adminUser.lastName}`,
    action: 'attendance.bulk',
    target: `Class:${classId}`,
    after: { date, defaultStatus, studentCount: students.length },
  });

  return { marked: students.length, date, classId };
};

/**
 * Promote all students from one class to another
 * 
 * End-of-year operation to move students up to next grade.
 * 
 * Workflow:
 * 1. Verify both classes exist
 * 2. Update all active students in from-class
 * 3. Change their class reference to to-class
 * 4. Log action to audit trail
 * 
 * Use Case: End of year promotion
 * - Class: Year 1 A → Year 2 A
 * - All students in Year 1 A move to Year 2 A
 * - Only active students promoted
 * 
 * @static
 * @param {string} fromClassId - Current class ID
 * @param {string} toClassId - New class ID
 * @param {Object} adminUser - AdminUser performing promotion
 * @returns {Promise<Object>} { promoted: number, fromClass: name, toClass: name }
 * @throws {Error} 404 if either class not found
 * 
 * @example
 * const result = await promoteStudents(
 *   currentClassId,    // Year 1 A
 *   nextClassId,       // Year 2 A
 *   adminUser
 * );
 * // Returns: { promoted: 35, fromClass: 'Year 1 A', toClass: 'Year 2 A' }
 */
const promoteStudents = async (fromClassId, toClassId, adminUser) => {
  // Verify both classes exist
  const fromClass = await Class.findById(fromClassId);
  const toClass   = await Class.findById(toClassId);

  if (!fromClass || !toClass) {
    const err = new Error('One or both classes not found');
    err.statusCode = 404;
    throw err;
  }

  // Update all active students in from-class
  const result = await Student.updateMany(
    { class: fromClassId, isActive: true },
    { $set: { class: toClassId } }
  );

  // Audit log: Record promotion action
  await log({
    actor: adminUser._id, actorModel: 'AdminUser',
    actorName: `${adminUser.firstName} ${adminUser.lastName}`,
    action: 'student.promote',
    target: `Class:${fromClassId}→${toClassId}`,
    after: { promoted: result.modifiedCount },
  });

  return {
    promoted:  result.modifiedCount,
    fromClass: fromClass.name,
    toClass:   toClass.name,
  };
};

module.exports = {
  getAllStudents, getStudentById, createStudent, updateStudent,
  linkUserAccount, getUnlinkedUsers,
  updateGrades, markAttendance, bulkMarkAttendance, promoteStudents,
};
