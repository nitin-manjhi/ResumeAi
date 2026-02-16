# Low-Level Design (LLD) - ResumeAi

## 1. Backend Design (Spring Boot)
The backend follows a layered architecture: **Controller -> Service -> Repository**.

### 1.1 Key Components
- **AuthResource / AuthService**: Manages user registration, login, and token refresh.
- **AdminResource / AdminService**: Handles administrative tasks like user management and quota updates.
- **ResumeExtractionResource**: Orchestrates PDF parsing and AI analysis.
- **JwtAuthFilter**: intercepted every request to validate the Bearer token and populate the SecurityContext.

### 1.2 Design Patterns
- **Mapper Pattern**: Using MapStruct to convert between Entities and DTOs (e.g., `User` -> `UserProfileResponse`).
- **Singleton**: Spring-managed Beans (Services/Repositories).
- **Strategy Pattern**: (Future) could be used to support different AI providers (OpenAI, Anthropic).

### 1.3 Error Handling
A `GlobalExceptionHandler` captures specialized exceptions (e.g., `ResourceNotFoundException`, `BadRequestException`) and returns standardized `ApiError` JSON responses.

---

## 2. Frontend Design (Angular)
The frontend is built using a modern **Signal-based** reactive architecture.

### 2.1 Component Structure
- **Smart Components**: Handle business logic and service calls (e.g., `AdminDashboardComponent`).
- **Presentational Components**: Standard UI elements from PrimeNG.
- **Services**: Injectable classes for API communication (`AdminService`, `AuthService`).

### 2.2 Security
- **AuthInterceptor**: Automatically attaches the JWT token to the `Authorization` header of all outbound HTTP requests.
- **AuthGuard**: Prevents unauthorized users from accessing routes like `/admin-dashboard`.

### 2.3 State Management
- **Angular Signals**: Used for storing UI state (loading flags, user lists) and providing reactive updates to templates.
- **LocalStorage**: persistent storage for JWT tokens and user profiles to survive page reloads.

---

## 3. Storage Design
- **PostgreSQL**: Stores relational data.
- **JSONB**: Used in `AnalysisResultEntity` to store raw AI responses, allowing for flexible schema evolution without migrations.
