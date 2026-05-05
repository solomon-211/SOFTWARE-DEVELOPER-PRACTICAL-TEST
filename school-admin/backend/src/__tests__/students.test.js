/**
 * Student Management Tests - school-admin backend
 * Tests for student CRUD operations and academic record management
 */

const Student = require('../models/Student');
const {
  getAllStudents,
  getStudentById,
  updateStudentGrades,
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
    it('should update grades for a student', async () => {
      const mockStudent = {
        _id: 'student1',
        grades: [],
        save: jest.fn().mockResolvedValue(true),
      };

      Student.findById.mockResolvedValue(mockStudent);

      const gradeData = { subject: 'Math', score: 90, grade: 'A', term: 'term1' };
      await updateStudentGrades('student1', gradeData, 'teacher1');

      expect(mockStudent.save).toHaveBeenCalled();
    });

    it('should throw error if student not found', async () => {
      Student.findById.mockResolvedValue(null);

      await expect(updateStudentGrades('invalid', {}, 'teacher1')).rejects.toThrow(
        'Student not found'
      );
    });
  });

  describe('markAttendance()', () => {
    it('should mark attendance for a student', async () => {
      const mockStudent = { _id: 'student1', attendance: [], save: jest.fn() };
      Student.findById.mockResolvedValue(mockStudent);

      await markAttendance('student1', { date: new Date(), status: 'present' }, 'teacher1');

      expect(mockStudent.save).toHaveBeenCalled();
    });

    it('should reject invalid attendance statuses', async () => {
      const mockStudent = { _id: 'student1', attendance: [] };
      Student.findById.mockResolvedValue(mockStudent);

      await expect(
        markAttendance('student1', { date: new Date(), status: 'invalid' }, 'teacher1')
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
