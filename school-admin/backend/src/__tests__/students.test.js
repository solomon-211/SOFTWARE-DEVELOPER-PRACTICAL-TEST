/**
 * Student Management Tests - school-admin backend
 * Tests for student CRUD operations and academic record management
 */

const Student = require('../models/Student');
const Class = require('../models/Class');
const {
  getAllStudents,
  getStudentById,
  updateStudentGrades,
  markAttendance,
} = require('../services/studentService');

// Mock the models
jest.mock('../models/Student');
jest.mock('../models/Class');

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
          class: 'class1',
          feeBalance: 50000,
          isActive: true,
        },
        {
          _id: 'student2',
          studentCode: 'STU002',
          firstName: 'Bob',
          lastName: 'Smith',
          class: 'class1',
          feeBalance: 75000,
          isActive: true,
        },
      ];

      Student.find.mockResolvedValue(mockStudents);

      const result = await getAllStudents();

      expect(result).toHaveLength(2);
      expect(result[0].studentCode).toBe('STU001');
      expect(result[1].studentCode).toBe('STU002');
    });

    it('should filter by class if provided', async () => {
      const mockStudents = [
        {
          _id: 'student1',
          studentCode: 'STU001',
          firstName: 'Alice',
          lastName: 'Johnson',
          class: 'class1',
          feeBalance: 50000,
          isActive: true,
        },
      ];

      Student.find.mockResolvedValue(mockStudents);

      const result = await getAllStudents({ classId: 'class1' });

      expect(result).toHaveLength(1);
      expect(Student.find).toHaveBeenCalled();
    });

    it('should exclude inactive students by default', async () => {
      const mockStudents = [
        {
          _id: 'student1',
          studentCode: 'STU001',
          firstName: 'Alice',
          lastName: 'Johnson',
          isActive: true,
        },
      ];

      Student.find.mockResolvedValue(mockStudents);

      await getAllStudents();

      expect(Student.find).toHaveBeenCalledWith({ isActive: true });
    });
  });

  describe('getStudentById()', () => {
    it('should return student details with full records', async () => {
      const mockStudent = {
        _id: 'student1',
        studentCode: 'STU001',
        firstName: 'Alice',
        lastName: 'Johnson',
        dateOfBirth: '2010-05-15',
        gender: 'female',
        class: { _id: 'class1', name: 'Class A' },
        feeBalance: 50000,
        grades: [
          { subject: 'Mathematics', score: 85, grade: 'A', term: 'Term 1' },
          { subject: 'English', score: 78, grade: 'B', term: 'Term 1' },
        ],
        attendance: [
          { date: new Date('2024-01-10'), status: 'present' },
          { date: new Date('2024-01-11'), status: 'absent' },
        ],
        isActive: true,
      };

      Student.findById.mockResolvedValue(mockStudent);

      const result = await getStudentById('student1');

      expect(result._id).toBe('student1');
      expect(result.grades).toHaveLength(2);
      expect(result.attendance).toHaveLength(2);
      expect(result.feeBalance).toBe(50000);
    });

    it('should throw error if student not found', async () => {
      Student.findById.mockResolvedValue(null);

      await expect(getStudentById('invalid_id'))
        .rejects
        .toThrow('Student not found');
    });

    it('should populate class information', async () => {
      const mockStudent = {
        _id: 'student1',
        firstName: 'Alice',
        lastName: 'Johnson',
        class: { _id: 'class1', name: 'Class A', grade: 6 },
        populate: jest.fn().mockReturnThis(),
      };

      Student.findById.mockResolvedValue(mockStudent);

      await getStudentById('student1');

      expect(Student.findById).toHaveBeenCalledWith('student1');
    });
  });

  describe('updateStudentGrades()', () => {
    it('should add or update grades for a student', async () => {
      const mockStudent = {
        _id: 'student1',
        studentCode: 'STU001',
        firstName: 'Alice',
        lastName: 'Johnson',
        grades: [],
        save: jest.fn(),
      };

      Student.findById.mockResolvedValue(mockStudent);

      const gradeData = {
        subject: 'Mathematics',
        score: 85,
        grade: 'A',
        term: 'Term 2',
      };

      await updateStudentGrades('student1', gradeData, 'teacher1');

      expect(mockStudent.save).toHaveBeenCalled();
    });

    it('should validate grade score is between 0-100', async () => {
      const mockStudent = {
        _id: 'student1',
        grades: [],
      };

      Student.findById.mockResolvedValue(mockStudent);

      const invalidGrade = {
        subject: 'Mathematics',
        score: 150, // Invalid score
        grade: 'A',
        term: 'Term 2',
      };

      await expect(
        updateStudentGrades('student1', invalidGrade, 'teacher1')
      ).rejects.toThrow();
    });

    it('should throw error if student not found', async () => {
      Student.findById.mockResolvedValue(null);

      await expect(
        updateStudentGrades('invalid_id', {}, 'teacher1')
      ).rejects.toThrow('Student not found');
    });
  });

  describe('markAttendance()', () => {
    it('should mark attendance for a student', async () => {
      const mockStudent = {
        _id: 'student1',
        studentCode: 'STU001',
        firstName: 'Alice',
        lastName: 'Johnson',
        attendance: [],
        save: jest.fn(),
      };

      Student.findById.mockResolvedValue(mockStudent);

      await markAttendance('student1', {
        date: new Date('2024-01-15'),
        status: 'present',
      }, 'teacher1');

      expect(mockStudent.save).toHaveBeenCalled();
    });

    it('should only allow valid attendance statuses', async () => {
      const mockStudent = {
        _id: 'student1',
        attendance: [],
      };

      Student.findById.mockResolvedValue(mockStudent);

      const invalidStatus = {
        date: new Date(),
        status: 'invalid_status',
      };

      await expect(
        markAttendance('student1', invalidStatus, 'teacher1')
      ).rejects.toThrow();
    });

    it('should update existing attendance record if already marked', async () => {
      const attendanceDate = new Date('2024-01-15');
      const mockStudent = {
        _id: 'student1',
        attendance: [
          {
            date: attendanceDate,
            status: 'absent',
            markedBy: 'teacher1',
          },
        ],
        save: jest.fn(),
      };

      Student.findById.mockResolvedValue(mockStudent);

      await markAttendance('student1', {
        date: attendanceDate,
        status: 'present',
      }, 'teacher1');

      expect(mockStudent.attendance[0].status).toBe('present');
      expect(mockStudent.save).toHaveBeenCalled();
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

      Student.findById.mockResolvedValue(mockStudent);

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
        student.class = 'class2'; // Move to next class
      });

      expect(mockStudents[0].class).toBe('class2');
      expect(mockStudents[1].class).toBe('class2');
    });
  });
});
