/**
 * DTOs for transforming User documents before sending to the client.
 * Sensitive fields (passwordHash, __v, etc.) are omitted.
 */

const toPublicUser = (user) => ({
  id:             user._id,
  firstName:      user.firstName,
  lastName:       user.lastName,
  email:          user.email,
  phone:          user.phone,
  role:           user.role,
  studentProfile: user.studentProfile || null,   // student's academic record ID
  children:       user.children || [],            // parent's linked student IDs
  devices:        (user.devices || []).map((d) => ({
    deviceId:     d.deviceId,
    deviceName:   d.deviceName,
    verified:     d.verified,
    registeredAt: d.registeredAt,
  })),
  createdAt: user.createdAt,
});

const toStudentProfile = (student) => ({
  id:          student._id,
  studentCode: student.studentCode,
  firstName:   student.firstName,
  lastName:    student.lastName,
  dateOfBirth: student.dateOfBirth,
  gender:      student.gender,
  class:       student.class,
  feeBalance:  student.feeBalance,
});

const toGrades = (student) =>
  (student.grades || []).map((g) => ({
    subject:   g.subject,
    score:     g.score,
    grade:     g.grade,
    term:      g.term,
    updatedAt: g.updatedAt,
  }));

const toAttendance = (student) =>
  (student.attendance || []).map((a) => ({
    date:   a.date,
    status: a.status,
  }));

const toTransaction = (tx) => ({
  id:            tx._id,
  type:          tx.type,
  amount:        tx.amount,
  description:   tx.description,
  proof:         tx.proof || null,
  status:        tx.status,
  balanceBefore: tx.balanceBefore,
  balanceAfter:  tx.balanceAfter,
  createdAt:     tx.createdAt,
  processedAt:   tx.processedAt,
});

const toLinkingRequest = (request) => ({
  id:              request._id,
  studentCode:     request.studentCode,
  status:          request.status,
  message:         request.message || null,
  rejectionReason: request.rejectionReason || null,
  submittedAt:     request.createdAt,
  reviewedAt:      request.reviewedAt || null,
});

module.exports = { toPublicUser, toStudentProfile, toGrades, toAttendance, toTransaction, toLinkingRequest };
