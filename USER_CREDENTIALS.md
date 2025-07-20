# 🔐 Modulus LMS - User Credentials Reference

## 📋 Overview
This document contains all user credentials created for the Modulus LMS localhost development environment. These users were created on **July 18, 2025** for testing and development purposes.

---

## 👥 **DATABASE USERS**

### 🎓 **STUDENT USERS**
| Email | Password | ID | Name | Role | Level |
|-------|----------|----|----- |------|-------|
| `student@test.com` | `Mahtabmehek@1337` | 1001 | Test Student | student | 1 (Beginner) |
| `student@modulus.com` | `Mahtabmehek@1337` | 1002 | Modulus Student | student | 1 (Beginner) |

### 👨‍🏫 **INSTRUCTOR USERS**
| Email | Password | ID | Name | Role | Level |
|-------|----------|----|----- |------|-------|
| `instructor@test.com` | `Mahtabmehek@1337` | 501 | Test Instructor | instructor | 5 (Advanced) |
| `instructor@modulus.com` | `Mahtabmehek@1337` | 502 | Modulus Instructor | instructor | 5 (Advanced) |

### 👷 **STAFF USERS**
| Email | Password | ID | Name | Role | Level |
|-------|----------|----|----- |------|-------|
| `staff@test.com` | `Mahtabmehek@1337` | 101 | Test Staff | staff | 7 (Professional) |
| `staff@modulus.com` | `Mahtabmehek@1337` | 102 | Modulus Staff | staff | 7 (Professional) |
| `staffuser@test.com` | `password123` | 103 | Staff User | staff | 7 (Professional) |

### 🔧 **ADMIN USERS**
| Email | Password | ID | Name | Role | Level |
|-------|----------|----|----- |------|-------|
| `admin@test.com` | `Mahtabmehek@1337` | ✅ | Test Admin | admin | 10 (Expert) |
| `admin@modulus.com` | `Mahtabmehek@1337` | 2 | Modulus Admin | admin | 10 (Expert) |
| `admin@modulus.edu` | `Mahtabmehek@1337` | ✅ | System Administrator | admin | 10 (Expert) |

---

## 🎟️ **ACCESS CODES**

### Registration Access Codes
| Role | Access Code | Usage |
|------|-------------|-------|
| Student | `student2025` | Student registration |
| Instructor | `instructor2025` | Instructor registration |
| Staff | `staff2025` | Staff registration |
| Admin/Master | `mahtabmehek1337` | Admin registration |

---

## 🗄️ **DATABASE CREDENTIALS**

### PostgreSQL Database
| Parameter | Value |
|-----------|-------|
| **Host** | `localhost` |
| **Port** | `5432` |
| **Database** | `modulus` |
| **Username** | `postgres` |
| **Password** | `mahtab` |
| **Master Password** | `mahtab` |

---

## 🌐 **APPLICATION URLs**

### Local Development
| Service | URL | Port |
|---------|-----|------|
| **Frontend** | `http://localhost:3000` | 3000 |
| **Backend API** | `http://localhost:3001/api` | 3001 |
| **Health Check** | `http://localhost:3001/health` | 3001 |

---

## 🧪 **TESTING QUICK REFERENCE**

### Login Testing
```bash
# Test Student Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"Mahtabmehek@1337"}'

# Test Instructor Login  
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"instructor@test.com","password":"Mahtabmehek@1337"}'

# Test Staff Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@test.com","password":"Mahtabmehek@1337"}'

# Test Admin Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@modulus.com","password":"Mahtabmehek@1337"}'
```

### PowerShell Testing
```powershell
# Test Login via PowerShell
$body = @{
    email = "student@test.com"
    password = "Mahtabmehek@1337"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $body -ContentType "application/json"
```

---

## 📊 **USER STATISTICS**

- **Total Users Created:** 8
- **Students:** 2
- **Instructors:** 2  
- **Staff:** 3
- **Admins:** 1
- **All users are pre-approved:** ✅
- **Database sequence updated:** ✅

---

## 🔄 **REGENERATION COMMANDS**

### Recreate All Test Users
```bash
# Via API call
curl -X POST http://localhost:3001/api/admin/create-test-users

# Via PowerShell
Invoke-RestMethod -Uri "http://localhost:3001/api/admin/create-test-users" -Method Post
```

### View Existing Test Users
```bash
# Get all test users
curl http://localhost:3001/api/admin/test-users

# Via PowerShell
Invoke-RestMethod -Uri "http://localhost:3001/api/admin/test-users" -Method Get
```

---

## ⚠️ **IMPORTANT NOTES**

1. **Security:** These are development credentials only - DO NOT use in production
2. **Special User:** `staffuser@test.com` has a different password (`password123`)
3. **ID Ranges:** Users are assigned IDs based on role hierarchy
4. **Environment:** All credentials are for localhost development only
5. **Database:** PostgreSQL service must be running for authentication to work

---

## 📝 **CHANGE LOG**

| Date | Action | Details |
|------|---------|---------|
| 2025-07-18 | Initial Creation | Created 8 test users across all roles |
| 2025-07-18 | AWS Cleanup | Removed all AWS/Cognito dependencies |
| 2025-07-18 | Local Migration | Migrated to localhost-only authentication |

---

## 🛠️ **TROUBLESHOOTING**

### Common Issues
1. **Login Fails:** Check if PostgreSQL service is running
2. **Database Connection:** Verify database credentials in backend/.env
3. **Port Conflicts:** Ensure ports 3000/3001 are available
4. **Password Issues:** Double-check exact password spelling (case-sensitive)

### Verification Commands
```bash
# Check if backend is running
curl http://localhost:3001/health

# Check if database is accessible
curl http://localhost:3001/api/admin/test-users

# Test specific user login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@modulus.com","password":"Mahtabmehek@1337"}'
```

---

*Document generated on July 18, 2025 - Modulus LMS Development Team*
