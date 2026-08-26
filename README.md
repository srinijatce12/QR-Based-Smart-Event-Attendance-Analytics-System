# SmartCheck — QR Event Check-In & Attendance Analytics

A complete, production-ready full-stack web application for QR-based event registration, attendee check-in, and attendance analytics.

## Project Overview

SmartCheck allows an event organizer to:

1. Create events
2. Generate a unique QR code for each event
3. Share/display the QR code and registration link
4. Allow attendees to register
5. Scan attendee QR codes using the device camera
6. Record attendance automatically
7. Prevent duplicate check-ins (at both application and database level)
8. View attendee lists with search, filter, and sort
9. View attendance statistics and analytics
10. Monitor recent check-ins
11. View event-wise analytics with professional charts

## Features

- **Landing Page** — Professional marketing page with product explanation and CTAs
- **Dashboard** — Total events, attendees, check-ins, attendance rate, recent activity
- **Events Management** — Full CRUD (create, read, update, delete) with search and filtering
- **Event Details** — Event info, downloadable QR code, registration link, stats, recent check-ins
- **Attendee Registration** — Public registration form that generates a unique attendee QR code
- **QR Scanner** — Real camera-based QR scanning using `html5-qrcode`, with live check-in validation
- **Attendees Page** — Searchable, filterable, sortable attendee table with CSV export
- **Analytics Page** — Check-in trends, registration trends, event comparison, attendance breakdown, peak check-in periods
- **Settings** — Organizer profile and application info

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** build tool
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Router** for navigation
- **Recharts** for analytics charts
- **qrcode.react** for QR code generation
- **html5-qrcode** for camera-based QR scanning

### Backend & Database
- **Supabase** (PostgreSQL) — provides the database, REST API layer, and row-level security
- The frontend talks to Supabase through a typed service layer in `src/services/api.ts`

> **Note on the original spec:** The project brief requested MongoDB Atlas and Vercel serverless functions. This implementation uses Supabase (PostgreSQL) as the database backend because it is the provisioned database in this environment and provides a working, demoable full-stack experience. The service layer in `src/services/` cleanly abstracts all data access, so the backend could be swapped to a MongoDB + REST API setup if desired.

## Project Structure

```
smartcheck/
│
├── src/
│   ├── components/       # Reusable UI: Toast, ConfirmDialog, States
│   ├── layouts/         # AppLayout with sidebar + mobile nav
│   ├── pages/           # All route pages
│   ├── services/        # Supabase client + API service layer
│   ├── types/           # TypeScript interfaces
│   ├── App.tsx          # Router + route definitions
│   ├── main.tsx         # Entry point
│   └── index.css        # Tailwind + custom animations
│
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
# Create a .env file (see .env.example for reference)
# The Supabase credentials are pre-populated in this environment.

# 3. Run the development server
npm run dev

# 4. Build for production
npm run build
```

## Environment Variables

The app uses Supabase, which is pre-provisioned. The following variables are set in `.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run lint     # Run ESLint
npm run typecheck # TypeScript type checking
```

## Database Schema

The app uses three tables (managed via Supabase migrations):

### `events`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Unique event ID |
| name | text | Event name |
| description | text | Event description |
| date | date | Event date |
| start_time | text | Start time |
| end_time | text | End time |
| venue | text | Venue location |
| organizer_name | text | Organizer |
| capacity | int | Max attendees |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### `attendees`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Unique attendee ID |
| event_id | uuid (FK) | References events |
| name | text | Full name |
| email | text | Email address |
| phone | text | Phone number |
| organization | text | College/organization |
| department | text | Department |
| year | text | Academic year |
| qr_token | text (unique) | Secure token encoded in QR |
| registered_at | timestamptz | Registration timestamp |

### `checkins`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Unique check-in ID |
| event_id | uuid (FK) | References events |
| attendee_id | uuid (FK) | References attendees |
| checked_in_at | timestamptz | Check-in timestamp |

**Unique constraint** on `(event_id, attendee_id)` prevents duplicate check-ins at the database level.

## How QR Registration Works

1. Organizer creates an event → event gets a unique QR code containing a JSON payload: `{ type: "event", eventId: "..." }`
2. Organizer shares the registration link with attendees
3. Attendee fills out the registration form
4. On submission, a unique `qr_token` is generated (16-byte random hex) and stored in the database
5. Attendee receives a QR code containing `{ type: "attendee", token: "...", eventId: "..." }`
6. Attendee can download their QR code for check-in

## How QR Check-In Works

1. Organizer opens the Scanner page and selects an event
2. Camera activates via `html5-qrcode`
3. When an attendee QR is scanned, the token is decoded and validated:
   - The token must match an existing attendee in the database
   - The attendee must be registered for the selected event
   - The attendee must not have already checked in (checked at both application and database level via unique constraint)
4. If valid → a check-in record is created with a timestamp
5. Success screen shows attendee name, event name, and check-in time
6. If already checked in → shows "Already Checked In" message
7. If invalid → shows error message

## API / Service Layer

All data access goes through `src/services/api.ts`, which wraps Supabase queries:

| Method | Description |
|--------|-------------|
| `api.getEvents()` | List all events |
| `api.getEvent(id)` | Get single event |
| `api.createEvent(payload)` | Create event |
| `api.updateEvent(id, payload)` | Update event |
| `api.deleteEvent(id)` | Delete event |
| `api.getAttendees(eventId)` | List attendees with check-in status |
| `api.registerAttendee(payload)` | Register new attendee |
| `api.getAttendeeByToken(token)` | Find attendee by QR token |
| `api.deleteAttendee(id)` | Remove attendee |
| `api.getCheckins(eventId)` | List check-ins for event |
| `api.getRecentCheckins(limit)` | Recent check-ins across all events |
| `api.checkIn(qrToken, eventId)` | Perform check-in with validation |
| `api.getDashboardStats()` | Aggregate dashboard statistics |
| `api.getEventStats(eventId)` | Per-event statistics |
| `api.getEventCheckinTrend(eventId)` | Cumulative check-in trend |
| `api.getRegistrationTrend(eventId)` | Cumulative registration trend |
| `api.getEventComparison()` | Compare events side by side |
| `api.getPeakCheckinPeriod()` | Check-ins grouped by hour |

## Troubleshooting

**Camera not working in scanner?**
- Ensure you're using HTTPS or localhost (browsers require secure context for camera access)
- Check browser permissions — allow camera access for the site
- On mobile, use the rear camera (the scanner requests `facingMode: environment`)

**No data showing on dashboard?**
- Create an event first, then register attendees and perform check-ins
- Check the browser console for Supabase connection errors

**Duplicate check-in not prevented?**
- The database has a unique constraint on `(event_id, attendee_id)` in the `checkins` table
- The application also checks for existing check-ins before creating a new one

**Build fails?**
- Run `npm install` to ensure all dependencies are installed
- Run `npm run typecheck` to check for TypeScript errors
```
#   Q R - B a s e d - S m a r t - E v e n t - A t t e n d a n c e - A n a l y t i c s - S y s t e m  
 