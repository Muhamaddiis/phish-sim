# Phishing Simulation Tool (Educational)
<img src="/frontend/public/dash.png">
## ⚠️ ETHICAL & LEGAL WARNING

**THIS TOOL IS FOR AUTHORIZED SECURITY AWARENESS TRAINING ONLY**

- ✅ Use ONLY with explicit written permission from organization leadership and IT/Security teams
- ✅ Inform participants this is a training exercise (before or after, as appropriate)
- ✅ Never capture or reuse real credentials
- ❌ NEVER use against unauthorized targets
- ❌ NEVER use for malicious purposes

**Unauthorized use may violate laws including Computer Fraud and Abuse Act (CFAA) and similar international laws.**

## Overview

A simplified GoPhish-like phishing simulation platform for security awareness training:

- **Backend**: Go 1.22+ with Chi router, PostgreSQL, JWT auth, email tracking
- **Frontend**: Next.js 14+ with Tailwind CSS admin dashboard
- **Deployment**: Docker Compose for easy setup

### Key Features

- Campaign management with customizable email templates
- CSV bulk import with enriched target fields (department, role, location, etc.)
- Email tracking (opens, clicks, form submissions)
- Department-based analytics and reporting
- Interactive charts and data visualization
- Secure JWT authentication
- Export results to CSV

## Project Structure

```
phishing-sim-tool/
├── backend/
│   ├── cmd/server/main.go
│   ├── internal/
│   │   ├── db/
│   │   ├── models/
│   │   ├── handlers/
│   │   ├── mailer/
│   │   └── middleware/
│   ├── migrations/
│   ├── go.mod
│   └── go.sum
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
├── samples/
│   └── targets_sample.csv
├── docker-compose.yml
├── .env.example
└── README.md
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Go 1.22+ (for local development)
- Node.js 18+ (for local frontend development)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd phishing-sim-tool
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file with your settings:

```env
# Database
POSTGRES_DB=phishsim
POSTGRES_USER=phish
POSTGRES_PASSWORD=change_this_password
DB_HOST=db
DB_PORT=5432

# SMTP (see SMTP Configuration section below)
<!-- SMTP_HOST=smtp.gmail.com -->
<!-- SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password -->

# JWT Secret (change this!)
JWT_SECRET=change_this_to_random_string_min_32_chars

# App
APP_HOST=http://localhost:8080
FRONTEND_URL=http://localhost:3000
```

### 3. Start Services

```bash
# Start all services (backend + database)
docker-compose up -d

# View logs
docker-compose logs -f app
```

### 4. Create Admin User

```bash
# Access the backend container
docker-compose exec app sh

# Create admin user (inside container)
# This will be added to the main.go initialization
```

<!-- Or use the API directly:
```bash
curl -X POST http://localhost:8080/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!","role":"admin"}'
``` -->

### 5. Start Frontend (Development)

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`

### 6. Login

- Navigate to `http://localhost:3000/login`
- Username: `admin`
- Password: `Admin123!` (or whatever you set)

## SMTP Configuration

### Gmail Setup (Development/Testing)

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the generated password
3. Update `.env`:
   ```env
   <!-- SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password -->
   ```

### SendGrid Setup (Production)

<!-- 1. Sign up at sendgrid.com
2. Create an API key
3. Update `.env`:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key -->
   ```

<!-- ### Mailgun Setup

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password -->
```

## Usage Guide

### Creating a Campaign

1. Login to dashboard
2. Navigate to "Campaigns" → "Create Campaign"
3. Fill in:
   - Campaign Name
   - Email Subject (supports placeholders)
   - Email Body (HTML with placeholders)
   - From Address

#### Email Placeholders

Use these placeholders in your email templates:

- `{{Name}}` - Target's name
- `{{Email}}` - Target's email
- `{{Department}}` - Target's department
- `{{Role}}` - Target's role
- `{{Location}}` - Target's location
- `{{Link}}` - Tracking link (REQUIRED for click tracking)

Example template:
```html
<p>Hello {{Name}},</p>
<p>Your {{Department}} team needs to verify your account.</p>
<p><a href="{{Link}}">Click here to verify</a></p>
<p>IT Department</p>
```

### Importing Targets

1. Open your campaign
2. Click "Upload Targets (CSV)"
3. Upload CSV with these columns:

Required:
- `email` - Target email address

Optional:
- `name` - Full name
- `department` - Department name
- `role` - Job title
- `location` - Office location
- `employee_id` - Employee ID
- `manager` - Manager name

See `samples/targets_sample.csv` for example.

### Sending Campaign

1. After uploading targets, click "Send Campaign"
2. Emails will be sent in batches (rate-limited to avoid SMTP blocking)
3. Monitor progress in the campaign details page

### Viewing Results

#### Campaign Dashboard
- View open rates, click rates, submission rates
- Per-department breakdown
- Timeline of events
- Individual target status

#### Statistics Page
- Overall statistics across all campaigns
- Department comparison
- Role-based analysis
- Location-based metrics

#### Export Data
- Click "Export CSV" to download results
- Includes all events and timestamps

## API Documentation

### Authentication

All API routes under `/api/*` require JWT authentication (except `/api/login` and `/api/register`).

**Login:**
```bash
POST /api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin123!"
}

Response: Sets httpOnly cookie with JWT token
```

### Campaign Management

**List Campaigns:**
```bash
GET /api/campaigns
Authorization: Bearer <token>
```

**Create Campaign:**
```bash
POST /api/campaigns
Content-Type: application/json

{
  "name": "Q4 Security Test",
  "email_subject": "Action Required: {{Name}}",
  "email_body": "<html>...</html>",
  "from_address": "security@company.com"
}
```

**Get Campaign Details:**
```bash
GET /api/campaigns/{id}
```

**Upload Targets:**
```bash
POST /api/campaigns/{id}/upload-targets
Content-Type: multipart/form-data

Form data: file=<csv-file>
```

**Send Campaign:**
```bash
POST /api/campaigns/{id}/send
```

### Statistics

**Overall Stats:**
```bash
GET /api/stats?group_by=department
```

**Campaign Stats:**
```bash
GET /api/campaigns/{id}/stats
```

### Tracking (No Auth Required)

**Email Open Tracking:**
```bash
GET /open/{token}
Returns: 1x1 transparent GIF
```

**Link Click Tracking:**
```bash
GET /t/{token}
Redirects to: /landing/{token}
```

**Landing Page:**
```bash
GET /landing/{token}
Returns: Simulated login page
```

**Form Submission:**
```bash
POST /submit
Content-Type: application/json

{
  "token": "...",
  "username": "test",
  "password": "test"
}
```

## Development

### Backend Development

```bash
cd backend

# Install dependencies
go mod download

# Run migrations
# (Auto-runs on startup, or manually:)
# psql -U phish -d phishsim -f migrations/001_init.sql

# Run server
go run cmd/server/main.go
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
npm start
```

### Database Access

```bash
# Connect to PostgreSQL
docker-compose exec db psql -U phish -d phishsim

# View tables
\dt

# View campaigns
SELECT * FROM campaigns;

# View targets
SELECT * FROM targets LIMIT 10;

# View events
SELECT * FROM events ORDER BY created_at DESC LIMIT 20;
```

## Production Deployment

### 1. Update Environment Variables

- Change `JWT_SECRET` to a strong random string (32+ characters)
- Change all default passwords
- Update `APP_HOST` to your domain
- Use production SMTP credentials

### 2. Build and Deploy

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### 3. SSL/TLS Setup

Use a reverse proxy (Nginx/Caddy) with Let's Encrypt:

```nginx
server {
    listen 443 ssl;
    server_name phishsim.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
    }
    
    location /api {
        proxy_pass http://localhost:8080;
    }
}
```

### 4. Security Hardening

- Enable firewall rules (only allow 80/443)
- Regular security updates
- Database backups
- Monitor logs for suspicious activity
- Rate limiting on API endpoints

## Testing Locally

### Test with Your Own Email

1. Create campaign with your email as target
2. Send campaign
3. Check your email inbox
4. Click tracking link
5. Submit fake credentials on landing page
6. View results in dashboard

### Sample Test Flow

```bash
# 1. Login
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' \
  -c cookies.txt

# 2. Create campaign
curl -X POST http://localhost:8080/api/campaigns \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "email_subject": "Test",
    "email_body": "<p>Hello {{Name}}, <a href=\"{{Link}}\">click here</a></p>",
    "from_address": "test@example.com"
  }'

# 3. Upload targets CSV
curl -X POST http://localhost:8080/api/campaigns/{id}/upload-targets \
  -b cookies.txt \
  -F "file=@samples/targets_sample.csv"

# 4. Send campaign
curl -X POST http://localhost:8080/api/campaigns/{id}/send \
  -b cookies.txt
```

## Post-Campaign Communication

After completing a simulation, send this notification to participants:

---

**Subject: Security Awareness Training - Phishing Simulation**

Dear Team Member,

The email you received was part of an authorized security awareness training exercise conducted by our IT Security team.

**What happened:**
- You received a simulated phishing email
- This was a safe, controlled test to help improve our security awareness

**What we tracked:**
- Email opens (not personal content)
- Link clicks
- Form submissions (no data was stored or used)

**Key takeaways:**
- Always verify sender email addresses
- Hover over links before clicking
- Be suspicious of urgent requests
- Report suspicious emails to IT Security

**Resources:**
- Security Awareness Training: [link]
- How to Report Phishing: [link]
- Contact IT Security: security@company.com

Thank you for your participation in keeping our organization secure.

IT Security Team

---

## Troubleshooting

### Emails Not Sending

1. Check SMTP credentials in `.env`
2. Verify SMTP port is not blocked by firewall
3. Check logs: `docker-compose logs app`
4. Test SMTP connection:
   ```bash
   telnet smtp.gmail.com 587
   ```

### Database Connection Issues

```bash
# Check if database is running
docker-compose ps

# View database logs
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up -d
```

### Frontend Not Connecting to Backend

1. Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`
2. Check CORS settings in backend
3. Verify both services are running

### JWT Token Issues

1. Ensure `JWT_SECRET` is set and consistent
2. Clear browser cookies
3. Check token expiration time

## Contributing

This is an educational tool. Contributions should focus on:
- Security improvements
- Better documentation
- Additional analytics features
- UI/UX enhancements



<!-- ## Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Email: security@yourorganization.com -->

## Acknowledgments

Inspired by GoPhish and similar security awareness platforms.

---

**Remember: Always obtain proper authorization before conducting phishing simulations.**