/**
 * DTOs for the admin application.
 * Omit sensitive fields before sending to the frontend.
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

const toClientUser = (user) => ({
  id:        user._id,
  firstName: user.firstName,
  lastName:  user.lastName,
  email:     user.email,
  phone:     user.phone,
  role:      user.role,
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
  timetable:    cls.timetable || [],
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
