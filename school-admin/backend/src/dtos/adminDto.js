/**
 * ============================================================================
 * DATA TRANSFER OBJECTS (DTOs) - ADMIN
 * ============================================================================
 * 
 * DTOs transform database objects into safe API responses.
 * 
 * Benefits:
 * - Remove sensitive fields (passwordHash, internal IDs)
 * - Flatten nested objects for cleaner responses
 * - Decouple API contract from database schema
 * - Control what fields are exposed to frontend
 * 
 * Usage:
 * const user = await AdminUser.findById(id);
 * res.json({ success: true, data: toAdminUser(user) });  // Returns DTO
 */

/**
 * Transform AdminUser database object to API response DTO
 * 
 * Excludes: passwordHash, internal fields
 * 
 * @param {Object} user - AdminUser database document
 * @returns {Object} Safe user DTO for API response
 */
const toAdminUser = (user) => ({
  id:              user._id,
  firstName:       user.firstName,
  lastName:        user.lastName,
  email:           user.email,
  role:            user.role,
  assignedClasses: user.assignedClasses,
  isActive:        user.isActive,
  createdAt:       user.createdAt,
});

/**
 * Transform ClientUser database object to API response DTO
 * 
 * Includes: device information with verification status
 * Excludes: passwordHash
 * 
 * @param {Object} user - User database document
 * @returns {Object} Safe user DTO with devices
 */
const toClientUser = (user) => ({
  id:        user._id,
  firstName: user.firstName,
  lastName:  user.lastName,
  email:     user.email,
  phone:     user.phone,
  role:      user.role,
  // Transform device array: include verification status and timestamps
  devices:   user.devices.map((d) => ({
    deviceId:     d.deviceId,
    deviceName:   d.deviceName,
    verified:     d.verified,
    registeredAt: d.registeredAt,
    verifiedAt:   d.verifiedAt,
  })),
  isActive:  user.isActive,
  createdAt: user.createdAt,
});

/**
 * Transform Student database object to API response DTO
 * 
 * Returns: Basic student info without grades/attendance
 * Used for: Student lists, quick lookups
 * 
 * @param {Object} student - Student database document
 * @returns {Object} Safe student DTO
 */
const toStudent = (student) => ({
  id:          student._id,
  studentCode: student.studentCode,
  firstName:   student.firstName,
  lastName:    student.lastName,
  dateOfBirth: student.dateOfBirth,
  gender:      student.gender,
  class:       student.class,
  feeBalance:  student.feeBalance,
  isActive:    student.isActive,
  createdAt:   student.createdAt,
});

/**
 * Transform Class database object to API response DTO
 * 
 * Includes: Teacher assignments with subject mapping
 * 
 * @param {Object} cls - Class database document
 * @returns {Object} Safe class DTO
 */
const toClass = (cls) => ({
  id:           cls._id,
  name:         cls.name,
  grade:        cls.grade,
  section:      cls.section,
  // Array of { teacher: { id, firstName, lastName, email }, subject }
  teachers:     (cls.teachers || []).map((t) => ({
    subject: t.subject,
    teacher: t.teacher
      ? {
          id:        t.teacher._id || t.teacher,
          firstName: t.teacher.firstName,
          lastName:  t.teacher.lastName,
          email:     t.teacher.email,
        }
      : null,
  })),
  isActive:     cls.isActive,
  createdAt:    cls.createdAt,
});

/**
 * Transform FeeTransaction database object to API response DTO
 * 
 * Returns: Transaction details safe for API
 * 
 * @param {Object} tx - FeeTransaction database document
 * @returns {Object} Safe transaction DTO
 */
const toTransaction = (tx) => ({
  id:           tx._id,
  studentId:    tx.student,
  type:         tx.type,              // 'deposit' or 'withdraw'
  amount:       tx.amount,
  status:       tx.status,            // 'pending', 'approved', 'rejected'
  description:  tx.description,
  proof:        tx.proof,
  balanceBefore: tx.balanceBefore,
  balanceAfter: tx.balanceAfter,
  initiatedBy:  tx.initiatedBy,
  processedBy:  tx.processedBy,
  processedAt:  tx.processedAt,
  createdAt:    tx.createdAt,
});

/**
 * Transform Grade record to API response
 * 
 * Returns: Grade information
 * 
 * @param {Object} grade - Grade object from Student schema
 * @returns {Object} Safe grade DTO
 */
const toGrade = (grade) => ({
  subject:   grade.subject,
  score:     grade.score,
  grade:     grade.grade,
  term:      grade.term,
  updatedBy: grade.updatedBy,
  updatedAt: grade.updatedAt,
});

module.exports = {
  toAdminUser,
  toClientUser,
  toStudent,
  toClass,
  toTransaction,
  toGrade,
};
          email:     t.teacher.email,
        }
      : null,
  })),
  timetable:    cls.timetable,
  academicYear: cls.academicYear,
  isActive:     cls.isActive,
});

const toTransaction = (tx) => ({
  id:            tx._id,
  student:       tx.student,
  type:          tx.type,
  amount:        tx.amount,
  description:   tx.description,
  proof:         tx.proof || null,
  status:        tx.status,
  balanceBefore: tx.balanceBefore,
  balanceAfter:  tx.balanceAfter,
  processedBy:   tx.processedBy,
  processedAt:   tx.processedAt,
  createdAt:     tx.createdAt,
});

module.exports = { toAdminUser, toClientUser, toStudent, toClass, toTransaction };
