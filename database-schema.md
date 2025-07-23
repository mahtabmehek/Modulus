# Modulus LMS - Database Schema Diagram

## Database Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        int id PK
        string name
        string email
        string password_hash
        string role
        string student_id
        boolean approved
        timestamp created_at
        timestamp updated_at
    }
    
    COURSES {
        int id PK
        string title
        string description
        string code
        string department
        string academic_level
        int duration
        int total_credits
        timestamp created_at
        timestamp updated_at
    }
    
    MODULES {
        int id PK
        string title
        string description
        int course_id FK
        int order_index
        timestamp created_at
        timestamp updated_at
    }
    
    LABS {
        int id PK
        string title
        string description
        string icon_path
        string lab_type
        int module_id FK
        int order_index
        boolean published
        timestamp created_at
        timestamp updated_at
    }
    
    MODULE_LABS {
        int id PK
        int module_id FK
        int lab_id FK
        int order_index
        timestamp created_at
    }
    
    TASKS {
        int id PK
        string title
        string description
        int lab_id FK
        int order_index
        json metadata
        timestamp created_at
        timestamp updated_at
    }
    
    QUESTIONS {
        int id PK
        string type
        string title
        string description
        string flag
        int points
        int task_id FK
        json metadata
        timestamp created_at
        timestamp updated_at
    }
    
    ENROLLMENTS {
        int id PK
        int user_id FK
        int course_id FK
        string status
        timestamp enrolled_at
        timestamp completed_at
    }
    
    LAB_COMPLETIONS {
        int id PK
        int user_id FK
        int lab_id FK
        boolean completed
        int score
        timestamp completed_at
        json submission_data
    }
    
    ACHIEVEMENTS {
        int id PK
        string title
        string description
        string badge_color
        string criteria_type
        json criteria_value
        timestamp created_at
    }
    
    USER_ACHIEVEMENTS {
        int id PK
        int user_id FK
        int achievement_id FK
        timestamp earned_at
    }
    
    DESKTOP_SESSIONS {
        int id PK
        int user_id FK
        int lab_id FK
        string session_id
        string status
        string vnc_port
        timestamp created_at
        timestamp last_activity
    }

    %% Relationships
    COURSES ||--o{ MODULES : "has"
    MODULES ||--o{ LABS : "contains"
    MODULES ||--o{ MODULE_LABS : "organizes"
    LABS ||--o{ MODULE_LABS : "belongs_to"
    LABS ||--o{ TASKS : "includes"
    TASKS ||--o{ QUESTIONS : "contains"
    USERS ||--o{ ENROLLMENTS : "enrolls_in"
    COURSES ||--o{ ENROLLMENTS : "has_students"
    USERS ||--o{ LAB_COMPLETIONS : "completes"
    LABS ||--o{ LAB_COMPLETIONS : "completed_by"
    USERS ||--o{ USER_ACHIEVEMENTS : "earns"
    ACHIEVEMENTS ||--o{ USER_ACHIEVEMENTS : "awarded_to"
    USERS ||--o{ DESKTOP_SESSIONS : "creates"
    LABS ||--o{ DESKTOP_SESSIONS : "runs_in"
```

## Simplified Core Schema

```mermaid
graph TD
    A[USERS] --> B[ENROLLMENTS]
    B --> C[COURSES]
    C --> D[MODULES]
    D --> E[LABS]
    E --> F[TASKS]
    F --> G[QUESTIONS]
    
    A --> H[LAB_COMPLETIONS]
    E --> H
    
    A --> I[USER_ACHIEVEMENTS]
    J[ACHIEVEMENTS] --> I
    
    A --> K[DESKTOP_SESSIONS]
    E --> K
    
    D --> L[MODULE_LABS]
    E --> L
    
    subgraph "User Management"
        A
        B
        H
        I
        K
    end
    
    subgraph "Content Structure"
        C
        D
        E
        F
        G
        L
    end
    
    subgraph "Gamification"
        J
        I
    end
```

## Table Relationships Overview

```mermaid
flowchart LR
    subgraph "Academic Structure"
        A[Courses] --> B[Modules]
        B --> C[Labs]
        C --> D[Tasks]
        D --> E[Questions]
    end
    
    subgraph "User Management"
        F[Users] --> G[Enrollments]
        F --> H[Lab Completions]
        F --> I[Achievements]
        F --> J[Desktop Sessions]
    end
    
    subgraph "Content Organization"
        K[Module Labs] --> B
        K --> C
    end
    
    G --> A
    H --> C
    I --> L[Achievement Definitions]
    J --> C
```

## Key Database Features

### 📊 **Core Tables**
- **USERS**: Student, instructor, admin, and staff accounts
- **COURSES**: Academic programs and degree structures
- **MODULES**: Course subdivisions and learning units
- **LABS**: Hands-on exercises and practical work
- **TASKS**: Individual lab components and activities
- **QUESTIONS**: Assessment items and interactive elements

### 🔗 **Relationship Tables**
- **ENROLLMENTS**: Student-course associations
- **MODULE_LABS**: Module-lab organization mapping
- **LAB_COMPLETIONS**: Student progress tracking
- **USER_ACHIEVEMENTS**: Gamification and badge system

### 🖥️ **System Tables**
- **DESKTOP_SESSIONS**: Virtual desktop management
- **ACHIEVEMENTS**: Badge and reward definitions

### 🎯 **Key Relationships**
1. **Hierarchical Content**: Courses → Modules → Labs → Tasks → Questions
2. **User Progress**: Users → Enrollments → Lab Completions
3. **Flexible Organization**: Module-Labs many-to-many relationship
4. **Gamification**: Users → Achievements for engagement
5. **Virtual Environment**: Desktop Sessions for lab execution

### 🔐 **Security Features**
- Role-based access control via user roles
- Enrollment-based course access
- Lab completion tracking for progress
- Session management for virtual desktops

This schema supports the full Modulus LMS functionality including course management, lab exercises, student progress tracking, achievements system, and virtual desktop integration.
