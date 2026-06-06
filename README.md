# HR Pulse

A full-stack HR management platform built with React, Node.js, Express, JWT, and MySQL.

Built as a portfolio project based on a hackathon solution for managing talent across three pillars: recruitment, training, and employee wellbeing.

---

## Features

**Recruitment**

- HR admins post and manage job openings
- Public application form — no account required
- Candidate pipeline with status tracking (Applied → Reviewing → Interview → Offer → Hired/Rejected)

**Foundation Hub (Training)**

- Course creation with ordered sections
- Employee enrollment and section-by-section progress tracking
- Auto-issued certifications on course completion
- XP points awarded for learning activity

**Pulse (Wellbeing)**

- Daily mood and energy check-ins
- Supervisors view their team's check-ins and flag employees for follow-up
- HR Admin sees weekly mood and energy trends across the organization

**Roles**

- `employee` — personal dashboard, courses, check-ins
- `supervisor` — team check-ins, flagging
- `hr_admin` — full access, user management, analytics

---

## Tech stack

| Layer    | Technology                      |
| -------- | ------------------------------- |
| Frontend | React 18, Vite, React Router v6 |
| Backend  | Node.js, Express                |
| Auth     | JWT (jsonwebtoken), bcryptjs    |
| Database | MySQL, mysql2                   |
| Icons    | Lucide React                    |

---

## Getting started

### Prerequisites

- Node.js 18+
- MySQL running locally (XAMPP or Homebrew)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/hr-pulse.git
cd hr-pulse
```

### 2. Set up the database

Open MySQL and run:

```sql
CREATE DATABASE hr_pulse;
```

Then import the schema:

```bash
mysql -u root hr_pulse < server/src/db/schema.sql
```

### 3. Configure the server

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your MySQL credentials.

### 4. Install dependencies and seed demo data

```bash
# Server
cd server
npm install
npm run seed

# Client
cd ../client
npm install
```

### 5. Run the app

In two terminals:

```bash
# Terminal 1 — server
cd server
npm run dev

# Terminal 2 — client
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Demo accounts

After running `npm run seed`:

| Role       | Email                  | Password    |
| ---------- | ---------------------- | ----------- |
| HR Admin   | admin@hrpulse.com      | password123 |
| Supervisor | supervisor@hrpulse.com | password123 |
| Employee   | employee@hrpulse.com   | password123 |

---

## Project structure

hr-pulse/
├── client/ # React frontend
│ └── src/
│ ├── api/ # Axios instance
│ ├── components/ # Shared layout
│ ├── context/ # Auth context
│ ├── pages/ # All page components
│ └── routes/ # Route guards
└── server/ # Express backend
└── src/
├── controllers/ # Business logic
├── db/ # Schema and pool
├── middleware/ # JWT auth + role guard
└── routes/ # API route definitions

---

## Roadmap

- [ ] AI-powered course recommendations
- [ ] Mobile app (React Native)
- [ ] Email notifications for flagged check-ins
- [ ] PDF certificate generation
- [ ] Advanced analytics dashboard

## Demo accounts

admin@hrpulse.com — hr_admin
supervisor@hrpulse.com — supervisor
employee@hrpulse.com — employee
Password for all: password123
