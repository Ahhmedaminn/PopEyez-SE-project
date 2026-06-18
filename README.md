# PopEyez SE Project

PopEyez is a full-stack pop-up event management platform built for Milestone 2. It translates the provided Event Management Platform user journeys into a working React, Node.js, and PostgreSQL application.

The platform supports five stakeholder workspaces:

- Event Organizer
- Team Member / Staff
- Vendor / Supplier
- Guest
- Venue Owner

## Team Members and Contributions

| Team member | Role / contribution |
| --- | --- |
| Ahmed Amin | Responsible for the full backend and frontend implementation for the Event Organizer workspace and the Venue Owner workspace. |
| Adam Mousa | Responsible for the full backend and frontend implementation for the Team Member / Staff workspace. |
| Karma Elsabahy | Responsible for the full backend and frontend implementation for the Vendor / Supplier workspace. |
| Mohamed Waleed | Responsible for the full backend and frontend implementation for the Guest workspace. |
| Abdelrahman Gamal | Responsible for the digital floor plan features, including the organizer drag-and-drop venue layout designer, layout sharing, layout export, and staff shared-floor-plan viewing. |

## Technologies Used

Frontend:

- React
- Vite
- CSS
- QR code generation with `qrcode`

Backend:

- Node.js
- Express
- PostgreSQL driver `pg`
- Multer for uploaded venue and invoice files
- dotenv for environment variables

Database:

- PostgreSQL
- pgAdmin or psql for database setup and testing

Development tools:

- Git and GitHub
- npm
- Visual Studio Code, optional

## Project Structure

```text
PopEyez-SE-project/
  backend/
    routes/
    uploads/
    db.js
    emailService.js
    ownership.js
    server.js
    package.json
  database/
    schema.sql
    seed.sql
  docs/
    AI-chatlog-MS2.md
  frontend/
    src/
      pages/
      components/
      api.js
      App.jsx
    package.json
  README.md
```

## Prerequisites

Install these before running the project:

- Node.js LTS
- npm
- PostgreSQL
- pgAdmin, optional but recommended
- Git

Check Node.js and npm:

```bash
node -v
npm -v
```

Both commands should print version numbers.

## Clone the Repository

Clone the GitHub repository, then open the project folder:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd PopEyez-SE-project
```

If using GitHub Desktop, clone the repository and open the folder in VS Code or another editor.

## Install Dependencies

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

Return to the project root when finished:

```bash
cd ..
```

## Database Setup

Create a PostgreSQL database named exactly:

```text
popeyez_db
```

You can create it in pgAdmin:

1. Open pgAdmin.
2. Connect to your local PostgreSQL server.
3. Right-click `Databases`.
4. Choose `Create` then `Database`.
5. Set the database name to `popeyez_db`.
6. Save.

Then open the Query Tool for `popeyez_db` and run the SQL files in this exact order:

1. `database/schema.sql`
2. `database/seed.sql`

Important: `schema.sql` resets the database tables. Run it before `seed.sql`.

## Dummy Data

The project includes meaningful generated dummy data in:

```text
database/seed.sql
```

The seed data creates connected demo records for:

- Users for all roles
- Organizers
- Staff members
- Vendors
- Guests
- Venue owners
- Events
- Venues and venue availability
- Booking requests
- Tasks
- Budgets and expenses
- Layouts
- Vendor sourcing requests
- Deliveries
- Invoices
- Guest invitations
- RSVPs
- Messages
- Check-ins
- Feedback

The seed data is designed to cover the main testing cases for the milestone, including:

- At least two active demo accounts for every role.
- Active and deactivated users.
- Active and inactive venues.
- Available and unavailable venue dates.
- Pending, approved, declined, and counter-proposal booking requests.
- Assigned, unassigned, pending, in-progress, done, and overdue tasks.
- Shared and private floor plans with canvas-ready layout elements.
- Pending, accepted, and declined sourcing requests.
- Preparing, out-for-delivery, delivered, and delayed vendor deliveries.
- Pending review, approved, paid, and rejected invoices.
- Draft, sent, opened, and cancelled invitations.
- Attending, not attending, maybe, and no-response RSVPs.
- Sent, received, and seen messages.
- Arrived and not-arrived guest check-ins.
- Positive, neutral, and negative feedback.

To reset the demo database, rerun:

```bash
psql -d popeyez_db -f database/schema.sql
psql -d popeyez_db -f database/seed.sql
```

## Environment Variables

Create a file named `.env` inside the `backend` folder:

```text
backend/.env
```

Add this content:

```env
PORT=5050
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/popeyez_db
APP_URL=http://localhost:5173
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

Example:

```env
PORT=5050
DATABASE_URL=postgresql://postgres:123456@localhost:5432/popeyez_db
APP_URL=http://localhost:5173
```

Do not commit `backend/.env`.

### Email Settings

For real email delivery, add this part to `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_STARTTLS=true
SMTP_USER=popeyezdemo@gmail.com
SMTP_PASS=YOUR_GOOGLE_APP_PASSWORD
SMTP_FROM_EMAIL=popeyezdemo@gmail.com
SMTP_FROM_NAME=PopEyez
```

## Run the Application

Open one terminal for the backend:

```bash
cd backend
npm run dev
```

The backend should run on:

```text
http://localhost:5050
```

Test the database connection in the browser:

```text
http://localhost:5050/api/test-db
```

Expected response:

```json
{
  "message": "Database connected successfully"
}
```

Open a second terminal for the frontend:

```bash
cd frontend
npm run dev
```

The frontend should run on:

```text
http://localhost:5173
```

Open that frontend URL in the browser.

## Demo Login Accounts

Use these seeded accounts to test the application. Passwords are stored as simple demo values for the milestone prototype. Each role has at least two active demo accounts.

| Role | Email | Password |
| --- | --- | --- |
| Organizer | `mariam.organizer@popeyez.demo` | `demo_hash_organizer` |
| Organizer | `farida.organizer@popeyez.demo` | `demo_hash_organizer2` |
| Staff | `omar.staff@popeyez.demo` | `demo_hash_staff` |
| Staff | `nour.staff@popeyez.demo` | `demo_hash_staff` |
| Staff | `heba.staff@popeyez.demo` | `demo_hash_staff` |
| Vendor | `karim.vendor@popeyez.demo` | `demo_hash_vendor` |
| Vendor | `laila.vendor@popeyez.demo` | `demo_hash_vendor` |
| Vendor | `yara.vendor@popeyez.demo` | `demo_hash_vendor` |
| Guest | `youssef.guest@popeyez.demo` | `demo_hash_guest` |
| Guest | `salma.guest@popeyez.demo` | `demo_hash_guest` |
| Guest | `mina.guest@popeyez.demo` | `demo_hash_guest` |
| Guest | `tarek.mostafa@example.com` | `demo_hash_guest` |
| Venue Owner | `hany.venue@popeyez.demo` | `demo_hash_owner` |
| Venue Owner | `tamer.venue@popeyez.demo` | `demo_hash_owner2` |

When an organizer adds a new guest with an email address, the backend also creates an active guest login account. The temporary password for those organizer-created guest accounts is `demo_hash_guest`.

## Quick Run Checklist

1. Start PostgreSQL.
2. Run `schema.sql`.
3. Run `seed.sql`.
4. Create `backend/.env`.
5. Run backend with `npm run dev`.
6. Run frontend with `npm run dev`.
7. Open `http://localhost:5173`.
8. Log in using one of the demo accounts.

## Implemented User Journeys

### Event Organizer

Implemented organizer flows:

- Create and update organizer profile details.
- Create accounts for staff, guests, and vendors.
- Deactivate stakeholder accounts.
- Browse available venue listings.
- Search and filter venues by city, capacity, price, and date.
- Submit venue booking requests.
- Track booking request statuses.
- Respond to venue-owner counter proposals.
- View organizer dashboard statistics.
- View upcoming events.
- Create events.
- Create tasks.
- Assign tasks to staff.
- Filter tasks by status.
- Track task status.
- Create and edit planned budget categories.
- Create and edit actual expenses.
- Compare planned budget and actual expenses.
- Design digital floor plans with draggable layout elements.
- Save, share, and export venue layouts.
- View staff lists and staff details.
- Filter staff by employment type and speciality.
- Search vendors and view vendor details.
- Submit sourcing requests to vendors.
- Track vendor delivery statuses.
- Review and update vendor invoice statuses.
- Manage guests.
- Filter guests by event, RSVP status, name, email, and dietary preference.
- Send digital invitations.
- View RSVP and dietary information.
- Send live day-of communications.
- Send follow-up messages to guests who have not seen messages.
- Review post-event feedback.
- Generate and export event reports as JSON.

### Team Member / Staff

Implemented staff flows:

- Log in using organizer-created credentials.
- View staff profile details.
- View assigned events.
- Filter assigned events by date range.
- View assigned operational tasks.
- Filter tasks by status.
- Update task progress.
- View shared floor plans designed by the organizer.
- Access guest check-in lists.
- Filter guests by check-in status.
- Update guest check-in status.
- View vendors associated with an event.
- Mark vendor arrivals.
- View day-of operations dashboard with total guests and arrived guests.
- View live messages for assigned events.

### Vendor / Supplier

Implemented vendor flows:

- Log in with organizer-provided credentials or register as a new vendor.
- View and update vendor profile details.
- View incoming sourcing requests.
- View request details including requested items, quantities, delivery date, and event location.
- Accept or decline sourcing requests.
- Send clarification notes to organizers.
- View accepted deliveries and associated events.
- Update delivery status.
- Log delivery confirmation or delay notes.
- Submit invoices for completed deliveries.
- Attach invoice supporting documents.
- View invoice review status.
- View invoice review notifications.

### Guest

Implemented guest flows:

- Log in with guest credentials.
- View digital invitations.
- View event details such as date, time, venue, dress code, agenda, and organizer contact.
- Submit RSVP responses: Attending, Not Attending, or Maybe.
- Add dietary preferences and special requirements.
- Update RSVP before the event date.
- Receive confirmation after RSVP submission.
- View day-of event messages.
- Mark messages as seen.
- View real QR codes for check-in.
- Use name confirmation as backup for check-in.
- View check-in status.
- Submit post-event feedback after check-in and after the event date.
- Rate overall experience, food, venue, and organization.
- Submit comments and sentiment.

### Venue Owner

Implemented venue owner flows:

- Register as a venue owner.
- Update owner profile details.
- Create venue listings.
- Upload venue photos and floor plans.
- Edit listing name, description, location, city, capacity, dimensions, amenities, and pricing.
- Set venue availability dates.
- Deactivate listings.
- Permanently remove listings.
- View booking requests for owned venues.
- Filter booking requests by venue, date range, and status.
- Approve or decline booking requests.
- Send counter proposals.
- View confirmed booking history.
- Filter confirmed bookings.
- View upcoming confirmed booking reminders.
- View venue performance dashboard.
- Review revenue and booking rate by venue.
- View historical booking data.
- Export venue performance report as PDF.


## Assumptions

The User Journeys document did not specify every technical detail, so the project uses these assumptions:

- Authentication is demo authentication for milestone testing. Passwords are stored as simple demo strings, not production hashes.
- Role-based access is handled through the logged-in user role and ownership fields such as organizer_id, assigned_to, vendor_user_id, guest_id, and owner_id.
- The application is intended for local development and class demonstration, not production deployment.
- If SMTP is not configured, invitation emails are saved locally in `backend/outbox`.
- QR codes encode local check-in data for staff verification in the app.
- Staff can mark vendor arrivals by setting the delivery status to `Delivered`.
- Uploaded files are stored locally in `backend/uploads`.
