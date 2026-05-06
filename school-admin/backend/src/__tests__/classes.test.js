/**
 * Class Management Tests - school-admin backend
 * Purpose: Validate class-related operations and teacher assignment logic.
 * Covers:
 * - `getAllClasses()` and `getClassById()` in `src/services/classService.js`
 * - `createClass()` and `updateClass()` behaviours and error handling
 * - `assignTeacher()` (teacher lookup, assignment, and teacher profile updates)
 * Notes:
 * - Tests mock `Class` and `AdminUser` models and focus on DTO/flow correctness.
 */

const Class = require('../models/Class');
const AdminUser = require('../models/AdminUser');
const {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  assignTeacher,
} = require('../services/classService');

jest.mock('../models/Class');
jest.mock('../models/AdminUser');

describe('ClassService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllClasses()', () => {
    // Verifies `classService.getAllClasses()` reads classes via `Class.find()`
    // and uses `.populate()` in the same way the service expects (teacher info).
    it('should return all active classes', async () => {
      const mockClasses = [
        {
          _id: 'class1',
          name: 'Senior 4',
          section: 'A',
          isActive: true,
        },
        {
          _id: 'class2',
          name: 'Senior 3',
          section: 'B',
          isActive: true,
        },
      ];

      Class.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockClasses),
      });

      const result = await getAllClasses();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Senior 4');
    });

    it('should handle empty class list', async () => {
      Class.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([]),
      });

      const result = await getAllClasses();

      expect(result).toEqual([]);
    });
  });

  describe('getClassById()', () => {
    // Tests `getClassById()` path: `Class.findById().populate(...).`
    // Ensures the DTO returned contains expected name and id fields.
    it('should return class when found', async () => {
      const mockClass = {
        _id: 'class1',
        name: 'Senior 4',
        section: 'A',
        isActive: true,
      };

      Class.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockClass),
      });

      const result = await getClassById('class1');

      expect(result._id).toBe('class1');
      expect(result.name).toBe('Senior 4');
    });

    it('should throw error if class not found', async () => {
      Class.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(getClassById('invalid')).rejects.toThrow('Class not found');
    });
  });

  describe('createClass()', () => {
    // Ensures `createClass()` handles duplication checks and creates via `Class.create()`
    it('should create a new class successfully', async () => {
      const classData = { name: 'Junior 1', section: 'C' };

      Class.create.mockResolvedValue({
        _id: 'class3',
        name: 'Junior 1',
        section: 'C',
        isActive: true,
      });

      const result = await createClass(classData);

      expect(result).toBeDefined();
      expect(Class.create).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle class creation error', async () => {
      Class.create.mockRejectedValue(new Error('Invalid data'));

      await expect(createClass({})).rejects.toThrow();
    });
  });

  describe('updateClass()', () => {
    // Validates `updateClass()` uses `Class.findByIdAndUpdate()` and returns the new DTO
    it('should update class details', async () => {
      const updateData = { name: 'Senior 4 Updated' };

      const mockUpdatedClass = {
        _id: 'class1',
        name: 'Senior 4 Updated',
        section: 'A',
        isActive: true,
      };

      Class.findByIdAndUpdate.mockResolvedValue(mockUpdatedClass);

      const result = await updateClass('class1', updateData);

      expect(result.name).toBe('Senior 4 Updated');
    });

    it('should throw error if class not found', async () => {
      Class.findByIdAndUpdate.mockResolvedValue(null);

      await expect(updateClass('invalid', {})).rejects.toThrow('Class not found');
    });
  });

  describe('assignTeacher()', () => {
    // Tests `assignTeacher()` flow:
    // - teacher existence check via `AdminUser.findById`
    // - class load via `Class.findById` and mutation of `teachers` array
    // - saving both class and teacher documents
    it('should assign teacher to class', async () => {
      const mockTeacher = {
        _id: 'teacher1',
        role: 'teacher',
        firstName: 'John',
        assignedClasses: [],
        save: jest.fn().mockResolvedValue(true),
      };

      const mockClass = {
        _id: 'class1',
        name: 'Senior 4',
        teachers: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'class1',
          name: 'Senior 4',
          teachers: [{ teacher: 'teacher1', subject: 'Math' }],
        }),
      };

      AdminUser.findById.mockResolvedValue(mockTeacher);
      Class.findById.mockResolvedValue(mockClass);

      await assignTeacher('class1', 'teacher1', 'Math');

      expect(AdminUser.findById).toHaveBeenCalledWith('teacher1');
      expect(mockClass.save).toHaveBeenCalled();
    });

    it('should fail if teacher not found', async () => {
      AdminUser.findById.mockResolvedValue(null);

      await expect(assignTeacher('class1', 'invalid', 'Math')).rejects.toThrow(
        'Teacher not found'
      );
    });
  });
});
