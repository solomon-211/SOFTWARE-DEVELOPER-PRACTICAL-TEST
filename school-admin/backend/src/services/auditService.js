/**
 * ============================================================================
 * AUDIT LOGGING SERVICE - ADMIN
 * ============================================================================
 * 
 * Records all system actions for compliance, security, and accountability.
 * 
 * Purpose:
 * - Track who made what changes
 * - When changes were made
 * - What changed (before/after)
 * - Why (action type)
 * 
 * Compliance:
 * - Supports regulatory audits
 * - Proves data integrity
 * - Tracks access patterns
 * - Provides accountability trail
 * 
 * Design:
 * - Non-blocking: Fire-and-forget to not impact main application flow
 * - Comprehensive: Logs user, time, action, affected data
 * - Safe: Errors in logging don't break application
 * 
 * Actions Logged:
 * - grade.update, attendance.mark, attendance.bulk
 * - student.promote, student.create, student.update
 * - auth.login, auth.createStaff
 * - device.verify, device.revoke
 * - fee.approve, fee.reject
 * - password.reset
 */

const AuditLog = require('../models/AuditLog');

/**
 * Log an action to the audit trail
 * 
 * Fire-and-forget pattern:
 * - Never throws or rejects
 * - Errors logged but don't break application
 * - Ensures main operations complete even if logging fails
 * 
 * Logged Information:
 * - actor: Who performed the action (userId)
 * - actorModel: Model type (AdminUser, ClientUser)
 * - actorName: Human-readable name (for reports)
 * - action: What happened (e.g., 'grade.update')
 * - target: What was affected (e.g., 'Student:60d5ec49...')
 * - before: Previous values (for change detection)
 * - after: New values (for verification)
 * - ip: Optional IP address for security
 * 
 * Action Types:
 * - grade.update: Teacher updated student grades
 * - attendance.mark: Single student attendance recorded
 * - attendance.bulk: Class attendance marked at once
 * - student.promote: Students moved to next class
 * - device.verify: Device approved for access
 * - fee.approve: Payment approved
 * - password.reset: Password changed
 * 
 * Before/After Pattern:
 * {
 *   before: { subject: "Math", score: 80 },
 *   after: { subject: "Math", score: 85 }
 * }
 * This allows tracking exactly what changed.
 * 
 * @static
 * @param {Object} data - Audit log data
 * @param {string} data.actor - Actor ID (user ID)
 * @param {string} data.actorModel - Model type (AdminUser/ClientUser)
 * @param {string} data.actorName - Human name (e.g., "John Doe")
 * @param {string} data.action - Action type (e.g., "grade.update")
 * @param {string} data.target - Affected entity (e.g., "Student:60d5ec...")
 * @param {*} data.before - Previous values (optional)
 * @param {*} data.after - New values (optional)
 * @param {string} data.ip - Request IP address (optional)
 * 
 * @example
 * // Log a grade update
 * await log({
 *   actor: teacherId,
 *   actorModel: 'AdminUser',
 *   actorName: 'John Doe',
 *   action: 'grade.update',
 *   target: 'Student:60d5ec49c1234567890abcd1',
 *   before: { score: 80, grade: 'B' },
 *   after: { score: 85, grade: 'A' }
 * });
 * 
 * @example
 * // Log device verification
 * await log({
 *   actor: adminId,
 *   actorModel: 'AdminUser',
 *   actorName: 'Admin User',
 *   action: 'device.verify',
 *   target: 'User:60d5ec50...',
 *   after: { deviceId: 'device123', verified: true }
 * });
 * 
 * // Fire-and-forget: Errors don't break the application
 * log({ ... }).catch(err => console.log('Audit error:', err));
 */
const log = async ({ actor, actorModel = 'AdminUser', actorName, action, target, before, after, ip }) => {
  try {
    // Create audit log entry in database
    await AuditLog.create({ 
      actor,        // User ID performing action
      actorModel,   // Model type (default: AdminUser)
      actorName,    // Human-readable name
      action,       // Type of action
      target,       // What was affected
      before,       // Previous state
      after,        // New state
      ip            // Requester IP
    });
  } catch (e) {
    // Log error but don't throw (fire-and-forget pattern)
    // Main application flow continues even if logging fails
    console.error('[AuditLog] Failed to write:', e.message);
  }
};

/**
 * Get recent audit logs for dashboard/reporting
 * 
 * Returns: Most recent logs first
 * Limited to recent entries for performance
 * 
 * Use Cases:
 * - Show activity dashboard to admins
 * - Generate compliance reports
 * - Investigate suspicious activity
 * - Track specific user actions
 * 
 * @static
 * @param {number} limit - Number of logs to return (default: 100)
 * @returns {Promise<Array>} Array of audit log documents
 * 
 * @example
 * // Get last 50 actions
 * const recent = await getRecentLogs(50);
 * recent.forEach(log => {
 *   console.log(log.actorName, 'did', log.action, 'to', log.target);
 * });
 * 
 * @example
 * // Show activity in dashboard
 * const logs = await getRecentLogs(100);
 * // Returns 100 most recent actions for dashboard display
 */
const getRecentLogs = async (limit = 100) => {
  return AuditLog.find({})
    .sort({ createdAt: -1 })  // Most recent first
    .limit(limit);            // Limit for performance
};

module.exports = { log, getRecentLogs };
