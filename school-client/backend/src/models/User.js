const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    firstName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    lastName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true 
    },
    phone: { 
      type: String, 
      trim: true 
    },

    passwordHash: { 
      type: String, 
      required: true
    },

    role: {
      type: String,
      enum: ['student', 'parent'],
      default: 'parent',
    },

    devices: [
      {
        deviceId: { 
          type: String, 
          required: true
        },
        deviceName: { 
          type: String
        },
        verified: { 
          type: Boolean, 
          default: false
        },
        registeredAt: { 
          type: Date, 
          default: Date.now
        },
        verifiedAt: {
          type: Date
        },
      },
    ],

    studentProfile: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Student' 
    },

    children: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Student' 
    }],

    isActive: { 
      type: Boolean, 
      default: true
    },
    refreshTokens: [
      {
        token: { type: String },
        createdAt: { type: Date, default: Date.now },
        lastUsedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { 
    timestamps: true
  }
);

userSchema.statics.hashPassword = function (password) {
  return crypto.createHash('sha512').update(password).digest('hex');
};

userSchema.methods.verifyPassword = function (password) {
  const hash = crypto.createHash('sha512').update(password).digest('hex');
  return hash === this.passwordHash;
};

userSchema.methods.isDeviceVerified = function (deviceId) {
  const device = this.devices.find((d) => d.deviceId === deviceId);
  return device ? device.verified : false;
};

module.exports = mongoose.model('User', userSchema);
