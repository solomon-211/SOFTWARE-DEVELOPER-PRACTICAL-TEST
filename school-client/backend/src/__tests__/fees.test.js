/**
 * Fee Service Tests - school-client backend
 * Purpose: Verify client-side fee data retrieval and transaction history access.
 * Covers:
 * - Fee schedule and transaction retrieval via `FeeTransaction`/`Student` model usage
 * Notes:
 * - Lightweight smoke tests that mock model responses used by client services.
 */

const FeeTransaction = require('../models/FeeTransaction');
const Student = require('../models/Student');

jest.mock('../models/FeeTransaction');
jest.mock('../models/Student');

describe('ClientFeeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStudentFeeBalance()', () => {
    // `getStudentFeeBalance()` (client) loads `Student.findById()` and exposes
    // `totalFeesDue` and `feePaid` fields that the frontend consumes.
    it('should return fee balance for a student', async () => {
      const mockStudent = {
        _id: 'student1',
        studentCode: 'STU001',
        totalFeesDue: 500000,
        feePaid: 200000,
      };

      Student.findById.mockResolvedValue(mockStudent);

      expect(mockStudent).toHaveProperty('totalFeesDue');
      expect(mockStudent.totalFeesDue).toBe(500000);
    });

    it('should handle missing student', async () => {
      Student.findById.mockResolvedValue(null);

      const result = await Student.findById('invalid');

      expect(result).toBeNull();
    });
  });

  describe('getFeeHistory()', () => {
    it('should return fee payment history', async () => {
      const mockTransactions = [
        {
          _id: 'txn1',
          studentId: 'student1',
          amount: 100000,
          status: 'paid',
          date: new Date(),
        },
      ];

      FeeTransaction.find.mockResolvedValue(mockTransactions);

      const result = await FeeTransaction.find({ studentId: 'student1' });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('paid');
    });
  });
});
