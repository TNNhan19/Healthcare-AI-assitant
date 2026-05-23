# Backend Compatibility Fixes

## Overview
This document outlines the compatibility issues found between the frontend authentication implementation and the existing backend API, along with the fixes applied.

## Issues Identified

### 1. API Endpoint Mismatch
**Problem**: Frontend was calling incorrect API endpoints
- **Frontend was calling**: `http://localhost:3000/api/auth/login` and `http://localhost:3000/api/auth/register`
- **Backend serves**: `http://localhost:8080/api/v1/auth/login` and `http://localhost:8080/api/v1/auth/register`

**Fix**: Updated all API calls in `AuthContext.tsx` to use the correct endpoints:
```typescript
// Before
const response = await fetch('http://localhost:3000/api/auth/login', {

// After  
const response = await fetch('http://localhost:8080/api/v1/auth/login', {
```

### 2. User Model Structure Mismatch
**Problem**: Frontend expected different user field names than what the backend provides
- **Frontend expected**: `firstName`, `lastName` fields
- **Backend uses**: `userName` field (single field for full name)

**Fix**: Updated the User interface in `AuthContext.tsx`:
```typescript
// Before
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

// After
interface User {
  _id: string;
  userName: string;
  email: string;
  phone: string;
  address?: string[];
  nickname?: string;
  dob?: string;
  gender?: string;
  defaultAddress?: string;
  paymentMethods?: string[];
  userType?: string;
  profile?: string;
  answer?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### 3. Registration Data Structure Mismatch
**Problem**: Frontend was sending incomplete data for registration
- **Frontend was sending**: `firstName`, `lastName`, `email`, `password`, `phone`
- **Backend expects**: `userName`, `email`, `password`, `phone`, `address`, `answer` (required fields)

**Fix**: Updated the RegisterData interface and form:
```typescript
// Before
interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

// After
interface RegisterData {
  userName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  answer: string;
  nickname?: string;
  dob?: string;
  gender?: string;
  defaultAddress?: string;
  paymentMethods?: string[];
}
```

### 4. Response Structure Handling
**Problem**: Frontend wasn't properly handling the backend's response structure
- **Backend returns**: `{ success, message, token, user }`
- **Frontend expected**: `{ token, user }`

**Fix**: Updated response handling in `AuthContext.tsx`:
```typescript
const data = await response.json();

if (!response.ok) {
  throw new Error(data.message || 'Login failed');
}

if (data.success) {
  // Store token and user data
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  setUser(data.user);
  return true;
} else {
  throw new Error(data.message || 'Login failed');
}
```

### 5. Registration Flow Issue
**Problem**: Backend registration doesn't return a token, but frontend expected one
- **Backend behavior**: Registration only creates user, doesn't log them in
- **Frontend expectation**: Registration should automatically log in the user

**Fix**: Updated registration to automatically login after successful registration:
```typescript
if (data.success) {
  // For registration, we need to login the user after successful registration
  // since the backend doesn't return a token on registration
  const loginSuccess = await login(userData.email, userData.password);
  return loginSuccess;
}
```

## Files Modified

### 1. `src/context/AuthContext.tsx`
- Updated API endpoints to use correct backend URLs
- Fixed User interface to match backend model
- Updated RegisterData interface to include all required fields
- Improved error handling for backend responses
- Added automatic login after successful registration

### 2. `src/pages/RegisterPage.tsx`
- Changed form fields from `firstName`/`lastName` to `userName`
- Added required fields: `address` and `answer`
- Updated validation to match backend requirements
- Added proper phone number validation (10 digits)
- Updated form submission to send correct data structure

### 3. `src/components/Header.tsx`
- Updated user display to use `userName` instead of `firstName`
- Fixed user avatar initial to use `userName`

### 4. `src/pages/AccountPage.tsx`
- Updated profile form to use `userName` instead of `firstName`/`lastName`
- Fixed user profile display to show full name correctly

## Backend API Requirements

### Login Endpoint
- **URL**: `POST http://localhost:8080/api/v1/auth/login`
- **Body**: `{ email, password }`
- **Response**: `{ success: boolean, message: string, token: string, user: User }`

### Register Endpoint
- **URL**: `POST http://localhost:8080/api/v1/auth/register`
- **Body**: `{ userName, email, password, phone, address, answer, ...optional_fields }`
- **Response**: `{ success: boolean, message: string, user: User }`

### Required Fields for Registration
- `userName`: Full name of the user
- `email`: Valid email address (unique)
- `password`: Minimum 6 characters
- `phone`: Exactly 10 digits
- `address`: User's address
- `answer`: Security question answer

### Optional Fields
- `nickname`: User's nickname
- `dob`: Date of birth
- `gender`: 'male', 'female', 'other', or empty string
- `defaultAddress`: Default address
- `paymentMethods`: Array of payment methods

## Testing the Integration

1. **Start the backend server**:
   ```bash
   cd Health_Care_Product
   npm start
   ```

2. **Start the frontend development server**:
   ```bash
   cd Health_Care_Product
   npm run dev
   ```

3. **Test Registration**:
   - Navigate to `/register`
   - Fill in all required fields
   - Submit the form
   - Should automatically log in after successful registration

4. **Test Login**:
   - Navigate to `/login`
   - Use registered email and password
   - Should successfully log in and redirect

5. **Test Protected Routes**:
   - Try accessing `/account` without being logged in
   - Should redirect to `/login`
   - After login, should be able to access `/account`

## Notes

- The backend runs on port 8080, not 3000
- All API endpoints use the `/api/v1/` prefix
- The backend uses MongoDB with Mongoose
- User passwords are hashed using bcryptjs
- JWT tokens are used for authentication
- The backend doesn't return tokens on registration, only on login

## Future Improvements

1. **Error Handling**: Add more specific error messages for different failure scenarios
2. **Token Refresh**: Implement token refresh mechanism
3. **Password Reset**: Add password reset functionality
4. **Email Verification**: Add email verification for new registrations
5. **Profile Updates**: Implement profile update functionality
6. **Logout API**: Add backend logout endpoint to invalidate tokens 