# API Documentation - ResumeAi

## Base URL
`http://localhost:8080/api`

## 1. Authentication (`/auth`)

### POST `/signup`
- **Description**: Registers a new user.
- **Request Body**: `SignupRequest` (username, name, email, password)
- **Response**: `AuthResponse` (JWT Token, User Profile)

### POST `/login`
- **Description**: Authenticates a user.
- **Request Body**: `LoginRequest` (username, password)
- **Response**: `AuthResponse`

### GET `/refresh`
- **Description**: Refreshes the JWT token.
- **Response**: `AuthResponse`

### GET `/profile`
- **Description**: Retrieves current user info.
- **Auth**: Bearer Token required.

---

## 2. Administration (`/admin`)
*All endpoints require ADMIN role.*

### GET `/users`
- **Description**: Lists all registered users.
- **Response**: `List<UserProfileResponse>` (Password excluded)

### PUT `/users/{userId}/usage`
- **Description**: Updates user usage quotas and roles.
- **Query Params**: `analysisCount`, `generationCount`, `usageLimit`, `role`.
- **Response**: `UserUsageResponse` (Updated fields only)

### GET `/upgrade-requests`
- **Description**: Fetches pending upgrade requests.

---

## 3. Resume Operations (`/resume`)

### POST `/extract`
- **Description**: Parses a PDF and extracts text/data.
- **Request**: Multipart File.

### POST `/analyze`
- **Description**: High-level analysis of resume vs JD.
- **Request Body**: `ResumeAnalysisRequest` (resumeText, jdText)

---

## 4. Metadata (`/location`, `/education`)

### GET `/location/cities`
### GET `/education/colleges`
- **Description**: Helper endpoints for dropdown data in resume builders.
