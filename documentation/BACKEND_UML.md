# Backend UML Design - ResumeAi

## 1. Class Diagram (Core Backend Services)
This diagram illustrates the relationship between controllers, services, repositories, and the security layer.

```mermaid
classDiagram
    class AdminResource {
        -AdminService adminService
        +getAllUsers()
        +updateUserUsage()
        +getPendingUpgradeRequests()
    }
    
    class AdminService {
        <<interface>>
        +getAllUsers()
        +updateUserUsage()
    }
    
    class AdminServiceImpl {
        -UserRepository userRepository
        -UpgradeRequestRepository upgradeRequestRepository
        -UserMapper userMapper
        +getAllUsers()
        +updateUserUsage()
    }
    
    class UserRepository {
        <<interface>>
        +findByUsername()
        +findByEmail()
    }
    
    class User {
        +Long id
        +String username
        +String email
        +Role role
        +Integer usageLimit
    }

    class JwtAuthFilter {
        -AuthUtil authUtil
        +doFilterInternal()
    }

    AdminResource ..> AdminService : uses
    AdminServiceImpl ..|> AdminService : implements
    AdminServiceImpl --> UserRepository : uses
    AdminServiceImpl --> UserMapper : uses
    UserRepository --> User : manages
    JwtAuthFilter --> AuthUtil : uses
```

## 2. Authentication Flow (UML Sequence)
```mermaid
sequenceDiagram
    participant U as User
    participant C as AuthResource
    participant S as AuthServiceImpl
    participant AU as AuthUtil
    participant R as UserRepository

    U->>C: login(credentials)
    C->>S: login(request)
    S->>R: findByUsername(username)
    R-->>S: userEntity
    S->>S: validatePassword()
    S->>AU: generateAccessToken(user)
    AU-->>S: jwtToken
    S-->>C: AuthResponse(token, profile)
    C-->>U: 200 OK (JWT)
```

## 3. Resume Analysis Flow
```mermaid
sequenceDiagram
    participant U as User
    participant C as ResumeExtractionResource
    participant S as AiService
    participant O as Ollama (AI)
    participant DB as AnalysisResultRepository

    U->>C: extractAndAnalyze(pdf)
    C->>S: analyze(parsedText, jd)
    S->>O: Send Prompt
    O-->>S: AI Response (ATS Score, Tips)
    S->>DB: save(AnalysisResult)
    DB-->>S: savedEntity
    S-->>C: Response DTO
    C-->>U: 200 OK (AI JSON)
```
