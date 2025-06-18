# Database Setup Guide

## Prerequisites

1. **Install PostgreSQL** on your system
2. **Create a database** named `edusms`

## Quick Setup

### 1. Install PostgreSQL

**Windows:**
- Download from: https://www.postgresql.org/download/windows/
- Install with default settings
- Remember the password you set for the `postgres` user

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE edusms;

# Exit
\q
```

### 3. Set Environment Variables

Create a `.env.local` file in your project root:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/edusms
```

Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation.

### 4. Run Database Setup

```bash
# Install dependencies (if not already installed)
npm install

# Run the database setup script
node scripts/setup-database.js
```

### 5. Test the Application

```bash
npm run dev
```

Navigate to: http://localhost:3001

## Available Test Data

After running the setup script, you'll have:

### Schools
- **Academy High School** (ABC1234)
  - Login: `admin@academy.edu` / `temp123`
- **Innovation Elementary** (XYZ5678)
  - Login: `admin@innovation.edu` / `temp456`
- **Community Middle School** (DEF9012)
  - Login: `admin@community.edu` / `temp789`
- **St. Mary's High School** (stmarys)
  - Login: `admin@stmarys.edu` / `admin123`
- **Brighton Academy** (brighton)
  - Login: `admin@brighton.edu` / `admin123`

### Students
- **Emma Wilson** (STU001) - St. Mary's
- **James Davis** (STU002) - St. Mary's
- **Alex Rodriguez** (STU003) - Brighton
- **Sophia Kim** (STU004) - Brighton

### Test URLs
- School Portal: `http://localhost:3001/schools/stmarys`
- Student Portal: `http://localhost:3001/schools/stmarys/student/[student-id]`
- Parent Portal: `http://localhost:3001/schools/stmarys/parent/+1-555-0202`
- Fees Management: `http://localhost:3001/schools/stmarys/fees`

## Troubleshooting

### Connection Issues
- Make sure PostgreSQL is running
- Check your password in the DATABASE_URL
- Verify the database `edusms` exists

### Permission Issues
- Make sure the `postgres` user has access to create tables
- Run `GRANT ALL PRIVILEGES ON DATABASE edusms TO postgres;` if needed

### Port Issues
- If port 5432 is in use, change the port in DATABASE_URL
- Default PostgreSQL port is 5432 