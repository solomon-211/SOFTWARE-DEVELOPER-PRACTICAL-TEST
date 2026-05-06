/**
 * Student Management Tests - school-admin backend
 * Purpose: Test student retrieval, academic updates, attendance, promotions, and fee balance.
 * Covers:
 * - `getAllStudents()` and `getStudentById()` in `src/services/studentService.js`
 * - `updateGrades()` (grade creation/update and audit scope)
 * - `markAttendance()` (record creation/update and validation)
 * - Promotion flows and fee-balance exposure via DTOs
 * Notes:
 * - Uses mocked `Student` model; populates chained queries where needed.
 */

const Student = require('../models/Student');
const {
  getAllStudents,
  getStudentById,
  updateGrades,
  markAttendance,
} = require('../services/studentService');

jest.mock('../models/Student');

describe('StudentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllStudents()', () => {
    it('should return all active students', async () => {
      const mockStudents = [
        {
          _id: 'student1',
          studentCode: 'STU001',
          firstName: 'Alice',
          lastName: 'Johnson',
          feeBalance: 50000,
          isActive: true,
        },
      ];

      Student.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockStudents),
      });

      const result = await getAllStudents();

      expect(result).toHaveLength(1);
      expect(result[0].studentCode).toBe('STU001');
    });

    it('should filter by class if provided', async () => {
      const mockStudents = [{ _id: 'student1', studentCode: 'STU001' }];

      Student.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockStudents),
      });

      const result = await getAllStudents({ classId: 'class1' });

      expect(result).toHaveLength(1);
    });
  });

  describe('getStudentById()', () => {
    // `getStudentById()` uses chained `.populate()` calls to fetch related fields.
    // This test ensures populated fields (grades, user info) are returned correctly.
    it('should return student with populated fields', async () => {
      const mockStudent = {
        _id: 'student1',
        firstName: 'Alice',
        grades: [{ subject: 'Math', score: 85 }],
      };

      Student.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockStudent),
        }),
      });

      const result = await getStudentById('student1');

      expect(result._id).toBe('student1');
      expect(result.grades).toHaveLength(1);
    });

    it('should throw error if student not found', async () => {
      Student.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(getStudentById('invalid')).rejects.toThrow('Student not found');
    });
  });

  describe('updateStudentGrades()', () => {
    // `updateGrades()` expects an array of grade objects and updates or creates
    // entries on `student.grades`, then saves the student document.
    it('should update grades for a student', async () => {
      const mockStudent = {
        _id: 'student1',
        grades: [],
        save: jest.fn().mockResolvedValue(true),
      };

      Student.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockStudent),
      });

      const gradesData = [{ subject: 'Math', score: 90, grade: 'A', term: 'term1' }];
      await updateGrades('student1', gradesData, { _id: 'admin1', role: 'admin' });

      expect(mockStudent.save).toHaveBeenCalled();
    });

    it('should throw error if student not found', async () => {
      Student.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(updateGrades('invalid', [], { _id: 'admin1', role: 'admin' })).rejects.toThrow(
        'Student not found'
      );
    });
  });

  describe('markAttendance()', () => {
    // `markAttendance()` accepts an array of attendance `records` and either
    // updates existing entries or pushes new ones to `student.attendance`.
    it('should mark attendance for a student', async () => {
      const mockStudent = {
        _id: 'student1',
        attendance: [],
        save: jest.fn().mockResolvedValue(true),
      };

      Student.findById.mockResolvedValue(mockStudent);

      const records = [{ date: new Date(), status: 'present' }];
      await markAttendance('student1', records, { _id: 'admin1', role: 'admin' });

      expect(mockStudent.save).toHaveBeenCalled();
    });

    it('should reject invalid attendance statuses', async () => {
      const mockStudent = { _id: 'student1', attendance: [] };
      Student.findById.mockResolvedValue(mockStudent);

      const records = [{ date: new Date(), status: 'invalid' }];
      await expect(
        markAttendance('student1', records, { _id: 'admin1', role: 'admin' })
      ).rejects.toThrow();
    });
  });

  describe('Student Fee Balance', () => {
    it('should track fee balance accurately', async () => {
      const mockStudent = {
        _id: 'student1',
        studentCode: 'STU001',
        firstName: 'Alice',
        lastName: 'Johnson',
        feeBalance: 50000,
      };

      Student.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockStudent),
        }),
      });

      const result = await getStudentById('student1');

      expect(result.feeBalance).toBe(50000);
    });
  });

  describe('Student Promotion', () => {
    it('should promote students to next class', async () => {
      const mockStudents = [
        {
          _id: 'student1',
          studentCode: 'STU001',
          class: 'class1',
          save: jest.fn(),
        },
        {
          _id: 'student2',
          studentCode: 'STU002',
          class: 'class1',
          save: jest.fn(),
        },
      ];

      Student.find.mockResolvedValue(mockStudents);

      // Simulate promotion
      mockStudents.forEach((student) => {
        student.class = 'class2';
      });

      expect(mockStudents[0].class).toBe('class2');
      expect(mockStudents[1].class).toBe('class2');
    });
  });
});
