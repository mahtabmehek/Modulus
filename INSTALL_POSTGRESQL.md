# PostgreSQL Installation for Windows

## Quick Install Options

### Option 1: Official PostgreSQL Installer (Recommended)
1. Download from: https://www.postgresql.org/download/windows/
2. Run the installer
3. Set password for 'postgres' user (remember this!)
4. Keep default port 5432
5. Install pgAdmin (optional but recommended)

### Option 2: Chocolatey Package Manager
```powershell
# Install Chocolatey first if you don't have it
# https://chocolatey.org/install

# Install PostgreSQL
choco install postgresql --params '/Password:postgres'
```

### Option 3: Scoop Package Manager
```powershell
# Install Scoop first if you don't have it
# https://scoop.sh/

# Install PostgreSQL
scoop install postgresql
```

## After Installation

1. **Verify Installation:**
   ```powershell
   psql --version
   ```

2. **Start PostgreSQL Service:**
   ```powershell
   # Check service status
   Get-Service postgresql*
   
   # Start if not running
   Start-Service postgresql*
   ```

3. **Test Connection:**
   ```powershell
   psql -U postgres
   ```

4. **Run Database Setup:**
   ```powershell
   .\setup-postgresql-fixed.ps1
   ```

## Alternative: Use Docker (if you prefer)

```powershell
# Pull PostgreSQL image
docker pull postgres:15

# Run PostgreSQL container
docker run --name modulus-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=modulus -p 5432:5432 -d postgres:15

# Connect to create tables
docker exec -it modulus-postgres psql -U postgres -d modulus
```

## If PostgreSQL is Already Installed

Just run our setup script:
```powershell
.\setup-postgresql-fixed.ps1
```

The script will create the database and tables needed for Modulus LMS.
