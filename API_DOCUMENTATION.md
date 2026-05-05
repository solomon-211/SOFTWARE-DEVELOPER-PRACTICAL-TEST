# API Documentation - School Management System

## Overview

This document provides complete API endpoint documentation for both the Admin and Client applications.

## API Standards

All endpoints in this project follow the same conventions:

- Success responses use `{ success: true, data: ... }`
- Mutating endpoints can include a `message` field
- Error responses use `{ success: false, error: { message, statusCode, timestamp } }`
- DTOs remove sensitive fields before returning database records
- Audit logs capture important changes for security and compliance
- Teachers are limited to their assigned classes
- Services contain business rules while controllers only handle HTTP input and output

### Common Status Codes

- `200` for successful reads and updates
- `201` for created resources
- `400` for validation or request errors
- `401` for invalid or expired credentials
- `403` for permission failures
- `404` for missing records
- `409` for conflicts such as duplicate email addresses
- `500` for unexpected server errors

### Authentication Pattern

The admin API uses JWT tokens from the login endpoint. The client API also requires a verified device before access is granted. Tokens must be sent in the `Authorization` header as `Bearer <token>`.

### DTO Pattern

Database objects are transformed before they are sent to the frontend. This keeps internal fields such as password hashes and other implementation details out of API responses.

### Audit Logging Pattern

State-changing operations such as grade updates, attendance updates, fee approvals, and device verification are recorded in the audit trail.

### Service Layer Pattern

Controllers receive HTTP requests, call services, and return responses. Services perform the real business logic such as permission checks, balance updates, email notifications, and data validation.

---

## Table of Contents

1. [Admin API](#admin-api)
2. [Client API](#client-api)
3. [Authentication](#authentication)
4. [Error Responses](#error-responses)

---

## Admin API

### Base URL

```plaintext
http://localhost:5002/api
```

---

## Authentication Endpoints

### Admin Login

**POST** `/auth/login`

Authenticate an admin or staff member.

**Request Body:**

```json
{
  "email": "admin@school.rw",
  "password": "Admin@1234"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "Super",
      "lastName": "Admin",
      "email": "admin@school.rw",
      "role": "admin",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error - 401):**

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### Create Staff Member

**POST** `/auth/staff` *(admin only)*

Create a new teacher or staff account.

**Headers:**

```plaintext
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Teacher",
  "email": "john@school.rw",
  "password": "Teacher@1234",
  "role": "teacher"
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "firstName": "John",
    "lastName": "Teacher",
    "email": "john@school.rw",
    "role": "teacher",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Device Verification Endpoints

### Get Pending Device Verifications

**GET** `/devices/pending` *(admin only)*

Retrieve all unverified devices awaiting admin approval.

**Headers:**

```plaintext
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439010",
      "firstName": "John",
      "lastName": "Parent",
      "email": "john@example.com",
      "devices": [
        {
          "deviceId": "abc123def456",
          "deviceName": "iPhone 13",
          "verified": false,
          "registeredAt": "2024-01-10T15:20:00Z"
        }
      ]
    }
  ]
}
```

---

### Verify Device

**PATCH** `/devices/:userId/:deviceId/verify` *(admin only)*

Approve a device for user access.

**Headers:**

```plaintext
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Device verified",
  "data": {
    "deviceId": "abc123def456",
    "deviceName": "iPhone 13",
    "verified": true,
    "verifiedAt": "2024-01-15T10:35:00Z"
  }
}
```

---

### Revoke Device Access

**PATCH** `/devices/:userId/:deviceId/revoke` *(admin only)*

Revoke access for a previously verified device.

**Headers:**

```plaintext
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Device revoked"
}
```

---

## Student Management Endpoints

### Get All Students

**GET** `/students` *(admin/teacher)*

Retrieve list of all students with pagination support.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)
- `classId` (optional): Filter by class ID
- `search` (optional): Search by name or student code

**Headers:**

```plaintext
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439020",
      "studentCode": "STU001",
      "firstName": "Alice",
      "lastName": "Johnson",
      "dateOfBirth": "2010-05-15",
      "gender": "female",
      "class": "607f1f77bcf86cd799439030",
      "feeBalance": 50000,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### Get Student Details

**GET** `/students/:studentId` *(admin/teacher)*

Get complete student profile including grades, attendance, and fees.

**Headers:**

```plaintext
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439020",
    "studentCode": "STU001",
    "firstName": "Alice",
    "lastName": "Johnson",
    "dateOfBirth": "2010-05-15",
    "class": {
      "id": "607f1f77bcf86cd799439030",
      "name": "Class A",
      "grade": 6
    },
    "feeBalance": 50000,
    "grades": [
      {
        "subject": "Mathematics",
        "score": 85,
        "grade": "A",
        "term": "Term 1",
        "updatedAt": "2024-01-20T14:30:00Z"
      }
    ],
    "attendance": [
      {
        "date": "2024-01-10T00:00:00Z",
        "status": "present"
      }
    ]
  }
}
```

---

## Fee Management Endpoints

### Get All Fee Transactions

**GET** `/fees` *(admin only)*

Retrieve all fee transactions with filters.

**Query Parameters:**

- `studentId` (optional): Filter by student ID
- `status` (optional): pending, approved, rejected
- `type` (optional): deposit, withdrawal
- `page` (optional): Page number

**Headers:**

```plaintext
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439040",
      "student": "507f1f77bcf86cd799439020",
      "type": "deposit",
      "amount": 100000,
      "status": "pending",
      "description": "Payment for school fees",
      "proof": {
        "type": "link",
        "value": "https://payment-receipt.example.com/abc123"
      },
      "createdAt": "2024-01-15T10:20:00Z",
      "processedAt": null
    }
  ]
}
```

---

### Approve/Reject Fee Transaction

**PATCH** `/fees/:transactionId/process` *(admin only)*

Approve or reject a pending fee transaction.

**Headers:**

```plaintext
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**

```json
{
  "action": "approve"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Transaction processed",
  "data": {
    "id": "507f1f77bcf86cd799439040",
    "status": "approved",
    "processedAt": "2024-01-15T11:00:00Z",
    "processedBy": "507f1f77bcf86cd799439011"
  }
}
```

---

## Dashboard Endpoints

### Get Dashboard Statistics

**GET** `/dashboard/stats` *(admin only)*

Retrieve key statistics for the admin dashboard.

**Headers:**

```plaintext
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "totalStudents": 150,
    "totalTeachers": 12,
    "totalClasses": 8,
    "totalParents": 120,
    "attendanceRate": 92,
    "pendingDeviceVerifications": 5,
    "fees": {
      "totalCollected": 5000000,
      "totalRefunded": 250000,
      "pendingTransactions": 3
    }
  }
}
```

---

---

## Client API

### Client Base URL

```plaintext
http://localhost:5001/api
```

---

## Client Authentication Endpoints

### Register User

**POST** `/auth/register`

Register a new parent or student account.

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Parent",
  "email": "john@example.com",
  "phone": "+250788123456",
  "password": "SecurePass@123",
  "role": "parent",
  "deviceId": "abc123def456",
  "deviceName": "iPhone 13"
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "message": "Registration successful. Please wait for device verification by admin.",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439050",
      "firstName": "John",
      "lastName": "Parent",
      "email": "john@example.com",
      "phone": "+250788123456",
      "role": "parent",
      "devices": [
        {
          "deviceId": "abc123def456",
          "deviceName": "iPhone 13",
          "verified": false,
          "registeredAt": "2024-01-15T10:20:00Z"
        }
      ],
      "createdAt": "2024-01-15T10:20:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Login User

**POST** `/auth/login`

Authenticate a parent or student with device verification.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass@123",
  "deviceId": "abc123def456"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439050",
      "firstName": "John",
      "lastName": "Parent",
      "email": "john@example.com",
      "role": "parent",
      "devices": [
        {
          "deviceId": "abc123def456",
          "deviceName": "iPhone 13",
          "verified": true
        }
      ]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Get Current User Profile

**GET** `/auth/me`

Get authenticated user's profile.

**Headers:**

```plaintext
Authorization: Bearer <JWT_TOKEN>
X-Device-ID: abc123def456
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439050",
    "firstName": "John",
    "lastName": "Parent",
    "email": "john@example.com",
    "role": "parent",
    "devices": [...]
  }
}
```

---

## Client Fee Management Endpoints

### Get Fee Information

**GET** `/fees/:studentId`

Get student's fee balance and transaction history.

**Headers:**

```plaintext
Authorization: Bearer <JWT_TOKEN>
X-Device-ID: abc123def456
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "studentId": "507f1f77bcf86cd799439020",
    "balance": 50000,
    "transactions": [
      {
        "id": "507f1f77bcf86cd799439040",
        "type": "deposit",
        "amount": 100000,
        "status": "approved",
        "description": "Monthly fees",
        "createdAt": "2024-01-15T10:20:00Z",
        "processedAt": "2024-01-15T11:00:00Z"
      }
    ]
  }
}
```

---

### Submit Fee Payment (Deposit)

**POST** `/fees/:studentId/deposit`

Submit a fee payment request.

**Headers:**

```plaintext
Authorization: Bearer <JWT_TOKEN>
X-Device-ID: abc123def456
```

**Request Body:**

```json
{
  "amount": 100000,
  "description": "School fees for January",
  "proof": {
    "type": "link",
    "value": "https://payment-receipt.com/abc123"
  }
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "message": "Payment submitted for admin review",
  "data": {
    "id": "507f1f77bcf86cd799439040",
    "type": "deposit",
    "amount": 100000,
    "status": "pending",
    "createdAt": "2024-01-15T10:20:00Z"
  }
}
```

---

### Submit Refund Request (Withdraw)

**POST** `/fees/:studentId/withdraw`

Request a fee refund.

**Headers:**

```plaintext
Authorization: Bearer <JWT_TOKEN>
X-Device-ID: abc123def456
```

**Request Body:**

```json
{
  "amount": 25000,
  "description": "Refund for duplicate payment"
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "message": "Refund request submitted",
  "data": {
    "id": "507f1f77bcf86cd799439041",
    "type": "withdraw",
    "amount": 25000,
    "status": "pending",
    "createdAt": "2024-01-15T10:25:00Z"
  }
}
```

---

## Academic Records Endpoints

### Get Student Profile

**GET** `/academic/:studentId/profile`

Get student's basic academic information.

**Headers:**

```plaintext
Authorization: Bearer <JWT_TOKEN>
X-Device-ID: abc123def456
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439020",
    "studentCode": "STU001",
    "firstName": "Alice",
    "lastName": "Johnson",
    "dateOfBirth": "2010-05-15",
    "gender": "female",
    "class": {
      "id": "607f1f77bcf86cd799439030",
      "name": "Class A",
      "grade": 6
    }
  }
}
```

---

### Get Student Grades

**GET** `/academic/:studentId/grades`

Retrieve student's grade history by term.

**Query Parameters:**

- `term` (optional): Filter by specific term

**Headers:**

```plaintext
Authorization: Bearer <JWT_TOKEN>
X-Device-ID: abc123def456
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": [
    {
      "subject": "Mathematics",
      "score": 85,
      "grade": "A",
      "term": "Term 1",
      "updatedAt": "2024-01-20T14:30:00Z"
    },
    {
      "subject": "English",
      "score": 78,
      "grade": "B",
      "term": "Term 1",
      "updatedAt": "2024-01-20T14:30:00Z"
    }
  ]
}
```

---

### Get Attendance Record

**GET** `/academic/:studentId/attendance`

Get student's attendance history.

**Query Parameters:**

- `startDate` (optional): ISO date format
- `endDate` (optional): ISO date format

**Headers:**

```plaintext
Authorization: Bearer <JWT_TOKEN>
X-Device-ID: abc123def456
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-10T00:00:00Z",
      "status": "present"
    },
    {
      "date": "2024-01-11T00:00:00Z",
      "status": "absent"
    },
    {
      "date": "2024-01-12T00:00:00Z",
      "status": "present"
    }
  ]
}
```

---

### Get Timetable

**GET** `/academic/:studentId/timetable`

Get student's class timetable.

**Headers:**

```plaintext
Authorization: Bearer <JWT_TOKEN>
X-Device-ID: abc123def456
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "class": "Class A",
    "schedule": [
      {
        "day": "Monday",
        "periods": [
          {
            "time": "08:00-09:00",
            "subject": "Mathematics",
            "teacher": "John Teacher"
          },
          {
            "time": "09:00-10:00",
            "subject": "English",
            "teacher": "Jane Smith"
          }
        ]
      }
    ]
  }
}
```

---

## Authentication

### JWT Token

All protected endpoints require a valid JWT token in the Authorization header:

```plaintext
Authorization: Bearer <JWT_TOKEN>
```

### Device ID Header

Client endpoints also require the device ID header for verification:

```plaintext
X-Device-ID: <DEVICE_ID>
```

### Token Expiration

- Admin tokens expire in **8 hours**
- Client tokens expire in **1 day**

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Device not verified. Please wait for admin approval."
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Student not found"
}
```

### 409 Conflict

```json
{
  "success": false,
  "message": "Email already registered"
}
```

### 429 Too Many Requests

```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting

### Admin API Rate Limit

- **Rate Limit**: 200 requests per 15 minutes
- **Header**: `RateLimit-Remaining`

### Client API Rate Limit

- **Rate Limit**: 100 requests per 15 minutes
- **Header**: `RateLimit-Remaining`

---

## Example Usage

### Example: Admin Login

```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.rw",
    "password": "Admin@1234"
  }'
```

### Example: Get Dashboard Stats

```bash
curl -X GET http://localhost:5002/api/dashboard/stats \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Example: Student Registration

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Parent",
    "email": "john@example.com",
    "phone": "+250788123456",
    "password": "SecurePass@123",
    "deviceId": "abc123def456",
    "role": "parent"
  }'
```
