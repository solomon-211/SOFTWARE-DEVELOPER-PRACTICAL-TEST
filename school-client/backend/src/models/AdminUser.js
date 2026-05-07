const mongoose = require('mongoose');

/**
 * AdminUser — read-only mirror used by the client backend solely to resolve
 * population of timetable slot teachers. The admin backend owns this collection;
 * the client backend never writes to it.
 *
 * Only the fields needed by the client (name) are declared here.
 * The schema uses { strict: false } so any extra admin fields are ignored
 * rather than causing validation errors.
 */
const adminUserSchema = new mongoose.Schema(
  {
    firstName: { type: String },
    lastName:  { type: String },
  },
  {
    collection: 'adminusers', // must match the admin backend's collection name
    strict: false,            // ignore extra fields written by the admin backend
    timestamps: true,
  }
);

module.exports = mongoose.model('AdminUser', adminUserSchema);
