/**
 * Fee Service Tests - school-admin backend
 * Purpose: Validate fee transaction processing and error handling.
 * Covers:
 * - `processTransaction()` in `src/services/feeService.js` (lookup, state changes)
 * Notes:
 * - Mocks `FeeTransaction` model; focuses on core processing paths.
 */

const FeeTransaction = require('../models/FeeTransaction');
const { processTransaction } = require('../services/feeService');

jest.mock('../models/FeeTransaction');

describe('FeeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processTransaction()', () => {
    // `processTransaction()` looks up the FeeTransaction by id and mutates status
    // This test ensures an invalid id results in a thrown error path.
    it('should fail for invalid transaction', async () => {
      FeeTransaction.findById.mockResolvedValue(null);

      await expect(processTransaction('invalid', true)).rejects.toThrow();
    });
  });
});
