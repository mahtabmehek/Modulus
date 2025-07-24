# Modulus LMS Localhost Tech Stack Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MODULUS LMS LOCALHOST STACK                          │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                               CLIENT LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Browser (localhost:3000)                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   Next.js 15    │  │  React 18 TSX   │  │  Tailwind CSS   │                │
│  │   Frontend      │  │   Components    │  │     Styling     │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │    Zustand      │  │   Framer Motion │  │   @xterm/xterm   │                │
│  │ State Management│  │   Animations    │  │   Terminal UI   │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                   HTTP/HTTPS
                                   REST API + JWT
                                        │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Backend Server (localhost:3001)                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   Express.js    │  │    Node.js      │  │  JWT + bcrypt   │                │
│  │   REST API      │  │   JavaScript    │  │ Authentication  │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   Middleware    │  │   File Upload   │  │   CORS + Helmet │                │
│  │  Auth & RBAC    │  │     Multer      │  │   Security      │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                   SQL Queries
                                   pg Library
                                        │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               DATABASE LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  PostgreSQL Database (localhost:5432)                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │     Users       │  │     Courses     │  │      Labs       │                │
│  │   Roles & Auth  │  │   Modules       │  │   Tasks/Questions│                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │  Achievements   │  │   Enrollments   │  │   Submissions   │                │
│  │    Badges       │  │   Progress      │  │   File Storage  │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                 Docker API Calls
                                 Container Management
                                        │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            CONTAINERIZATION LAYER                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Docker Engine (localhost)                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │  Kali Container │  │  Kali Container │  │  Kali Container │                │
│  │   (Student 1)   │  │   (Student 2)   │  │   (Student N)   │                │
│  │  Port: 6901     │  │  Port: 6902     │  │  Port: 690N     │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│           │                       │                       │                    │
│    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            │
│    │   noVNC     │         │   noVNC     │         │   noVNC     │            │
│    │XFCE Desktop │         │XFCE Desktop │         │XFCE Desktop │            │
│    └─────────────┘         └─────────────┘         └─────────────┘            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                 WebSocket + HTTP
                                 Terminal Access
                                        │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              LAB ENVIRONMENT LAYER                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Lab Access Server (localhost:8080)                                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   WebSocket     │  │  Terminal.html  │  │   Session Mgmt  │                │
│  │  Real-time I/O  │  │  Browser Term   │  │   Persistence   │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   File Upload   │  │  Desktop Proxy  │  │ Resource Limits │                │
│  │   Management    │  │  noVNC Access   │  │  CPU/Memory     │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                               TESTING LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │     Cypress     │  │   SQLmap +      │  │     Nuclei      │                │
│  │   E2E Testing   │  │   Gitleaks      │  │ Vuln Scanning   │                │
│  │   (Firefox)     │  │ Security Tests  │  │                 │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘

NETWORK FLOW:
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Browser → Next.js (3000) → Express API (3001) → PostgreSQL (5432)              │
│                    ↓                                                            │
│ Terminal WebSocket (8080) ← Lab Server ← Docker Containers ← noVNC (690X)      │
└─────────────────────────────────────────────────────────────────────────────────┘

PORT MAPPING:
- Frontend:           localhost:3000 (Next.js)
- Backend API:        localhost:3001 (Express.js)
- Database:           localhost:5432 (PostgreSQL)
- Lab Server:         localhost:8080 (WebSocket Terminal)
- Kali Containers:    localhost:6901, 6902, 690N (noVNC)
```

## Tech Stack Components:

### **Frontend Stack:**
- **Next.js 15**: React framework with SSR/SSG
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Zustand**: Lightweight state management
- **@xterm/xterm**: Terminal emulation in browser

### **Backend Stack:**
- **Express.js**: REST API framework
- **Node.js**: JavaScript runtime
- **JWT**: Stateless authentication
- **bcrypt**: Password hashing
- **Multer**: File upload handling
- **pg**: PostgreSQL client

### **Database:**
- **PostgreSQL**: Relational database
- **Tables**: users, courses, labs, tasks, achievements, enrollments

### **Container Stack:**
- **Docker**: Container orchestration
- **Kali Linux**: Security-focused lab environments
- **noVNC**: Browser-based VNC client
- **XFCE**: Lightweight desktop environment

### **Security & Testing:**
- **Cypress**: End-to-end testing
- **SQLmap**: SQL injection testing
- **Nuclei**: Vulnerability scanning
- **Helmet**: Security headers

This architecture enables secure, scalable cybersecurity education with containerized lab environments accessible through modern web interfaces.
