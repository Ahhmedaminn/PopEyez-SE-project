PopEyez-SE-project

PopEyez is a full-stack pop-up event management platform built for Milestone 2.
The project uses:

React for the frontend
Node.js / Express for the backend
PostgreSQL for the database
pgAdmin for database setup and testing

The app supports multiple stakeholder journeys
1. Required Installations

Before running the project, install:

Node.js LTS

Download and install Node.js LTS.

After installing, check:

node -v
npm -v

Both commands should show version numbers.

PostgreSQL and pgAdmin

Install PostgreSQL and pgAdmin.

During installation, remember:

Username: postgres
Password: your chosen password
Port: 5432

You will need this password for the backend .env file.

Visual Studio Code

Use VS Code to open and run the project.

GitHub Desktop

Use GitHub Desktop to pull, commit, and push changes.

2. Clone the Repository

Open GitHub Desktop and clone the repository:

File → Clone Repository → PopEyez-SE-project

Then open the project in Visual Studio Code.

3. Install Backend Packages

Open a terminal in VS Code from the main project folder:

cd backend
npm install
4. Install Frontend Packages

Open another terminal or go back to the main folder:

cd ../frontend
npm install
5. Database Setup

Open pgAdmin.

Create a new database named exactly:

popeyez_db

Then open the Query Tool for popeyez_db.

Run the database files in this exact order:

1. database/schema.sql
2. database/seed.sql

Important: Always run schema.sql first, then seed.sql.

schema.sql creates/resets the database tables.
seed.sql inserts the demo data used for testing.

6. Create Backend Environment File

Inside the backend folder, create a file named:

.env

Add this content:

PORT=5050
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/popeyez_db
APP_URL=http://localhost:5173

Replace YOUR_PASSWORD with your PostgreSQL password.

Example:

PORT=5050
DATABASE_URL=postgresql://postgres:123456@localhost:5432/popeyez_db
APP_URL=http://localhost:5173

Do not commit the .env file.

Optional email setup for guest invitations:

If you want real invitation emails to be sent, also add SMTP settings to backend/.env:

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_STARTTLS=true
SMTP_USER=your_email_username
SMTP_PASS=your_email_password
SMTP_FROM_EMAIL=no-reply@popeyez.local
SMTP_FROM_NAME=PopEyez

If SMTP_HOST is empty, the app still creates the in-app invitation and saves the email as a .eml file in backend/outbox for local demo testing.

7. Run the Backend

In a terminal:

cd backend
npm run dev

The backend should run on:

http://localhost:5050

Test the database connection in the browser:

http://localhost:5050/api/test-db

Expected result:

{
  "message": "Database connected successfully"
}
8. Run the Frontend

Open a second terminal:

cd frontend
npm run dev

The frontend should run on:

http://localhost:5173

Open this link in the browser.
