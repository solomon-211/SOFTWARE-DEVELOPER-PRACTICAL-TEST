const Class = require('../models/Class');
const AdminUser = require('../models/AdminUser');
const { toClass } = require('../dtos/adminDto');

const getAllClasses = async () => {
  const classes = await Class.find({ isActive: true })
    .populate('teachers.teacher', 'firstName lastName email');
  return classes.map(toClass);
};

const getClassById = async (id) => {
  const cls = await Class.findById(id)
    .populate('teachers.teacher', 'firstName lastName email');
  if (!cls) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }
  return cls;
};

const createClass = async (data) => {
  const cls = await Class.create(data);
  return toClass(cls);
};

const updateClass = async (id, data) => {
  const cls = await Class.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!cls) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }
  return toClass(cls);
};

/**
 * Assign a teacher to a class for a specific subject.
 * If the teacher is already assigned to that subject in this class, update them.
 * A teacher can be assigned to multiple subjects in the same or different classes.
 */
const assignTeacher = async (classId, teacherId, subject) => {
  const teacher = await AdminUser.findById(teacherId);
  if (!teacher || teacher.role !== 'teacher') {
    const err = new Error('Teacher not found');
    err.statusCode = 404;
    throw err;
  }

  const cls = await Class.findById(classId);
  if (!cls) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }

  // Check if this subject already has a teacher assigned — replace them
  const existingIdx = cls.teachers.findIndex(
    (t) => t.subject.toLowerCase() === subject.toLowerCase()
  );

  if (existingIdx >= 0) {
    cls.teachers[existingIdx].teacher = teacherId;
  } else {
    cls.teachers.push({ teacher: teacherId, subject });
  }

  await cls.save();

  // Track on the teacher's profile which classes they're assigned to
  if (!teacher.assignedClasses.map(String).includes(String(classId))) {
    teacher.assignedClasses.push(classId);
    await teacher.save();
  }

  await cls.populate('teachers.teacher', 'firstName lastName email');
  return toClass(cls);
};

/**
 * Remove a teacher from a specific subject in a class.
 */
const removeTeacher = async (classId, subject) => {
  const cls = await Class.findById(classId);
  if (!cls) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }

  cls.teachers = cls.teachers.filter(
    (t) => t.subject.toLowerCase() !== subject.toLowerCase()
  );

  await cls.save();
  await cls.populate('teachers.teacher', 'firstName lastName email');
  return toClass(cls);
};

/**
 * Update the timetable for a class.
 */
const updateTimetable = async (classId, timetable) => {
  const cls = await Class.findByIdAndUpdate(
    classId,
    { timetable },
    { new: true, runValidators: true }
  );
  if (!cls) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    throw err;
  }
  return toClass(cls);
};

/**
 * Get all teachers for dropdowns.
 */
const getTeachers = async () => {
  const teachers = await AdminUser.find({ role: 'teacher', isActive: true })
    .select('firstName lastName email assignedClasses')
    .sort({ firstName: 1 });
  return teachers.map((t) => ({
    id:              t._id,
    firstName:       t.firstName,
    lastName:        t.lastName,
    email:           t.email,
    assignedClasses: t.assignedClasses,
  }));
};

module.exports = {
  getAllClasses, getClassById, createClass, updateClass,
  assignTeacher, removeTeacher, updateTimetable, getTeachers,
};
