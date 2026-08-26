/*
# SmartCheck schema — events, attendees, check-ins

1. New Tables
- `events`
  - id (uuid, primary key)
  - name (text, not null)
  - description (text)
  - date (date, not null)
  - start_time (text, not null)
  - end_time (text, not null)
  - venue (text, not null)
  - organizer_name (text, not null)
  - capacity (int, not null, default 100)
  - created_at (timestamptz, default now())
  - updated_at (timestamptz, default now())
- `attendees`
  - id (uuid, primary key)
  - event_id (uuid, fk events, on delete cascade)
  - name (text, not null)
  - email (text, not null)
  - phone (text, not null)
  - organization (text)
  - department (text)
  - year (text)
  - qr_token (text, not null, unique)
  - registered_at (timestamptz, default now())
- `checkins`
  - id (uuid, primary key)
  - event_id (uuid, fk events, on delete cascade)
  - attendee_id (uuid, fk attendees, on delete cascade)
  - checked_in_at (timestamptz, default now())
  - Unique constraint on (event_id, attendee_id) to prevent duplicate check-ins

2. Indexes
- attendees.event_id
- attendees.qr_token (unique)
- checkins.event_id
- checkins.attendee_id
- checkins (event_id, attendee_id) unique

3. Security
- Enable RLS on all three tables.
- Single-tenant (no sign-in) app: policies use TO anon, authenticated so the
  anon-key frontend can read/write its own data. Data is intentionally shared
  within the demo app.

4. Important notes
- The unique index on checkins(event_id, attendee_id) enforces duplicate
  check-in prevention at the database level, independent of frontend logic.
- qr_token is a random opaque string generated on attendee creation; it is the
  payload encoded in the attendee's QR code and is validated server-side before
  a check-in is accepted.
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  venue text NOT NULL,
  organizer_name text NOT NULL,
  capacity int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  organization text,
  department text,
  year text,
  qr_token text NOT NULL UNIQUE,
  registered_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  attendee_id uuid NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT checkins_event_attendee_unique UNIQUE (event_id, attendee_id)
);

CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_checkins_event_id ON checkins(event_id);
CREATE INDEX IF NOT EXISTS idx_checkins_attendee_id ON checkins(attendee_id);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- events policies
DROP POLICY IF EXISTS "events_select_all" ON events;
CREATE POLICY "events_select_all" ON events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "events_insert_all" ON events;
CREATE POLICY "events_insert_all" ON events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "events_update_all" ON events;
CREATE POLICY "events_update_all" ON events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "events_delete_all" ON events;
CREATE POLICY "events_delete_all" ON events FOR DELETE
  TO anon, authenticated USING (true);

-- attendees policies
DROP POLICY IF EXISTS "attendees_select_all" ON attendees;
CREATE POLICY "attendees_select_all" ON attendees FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "attendees_insert_all" ON attendees;
CREATE POLICY "attendees_insert_all" ON attendees FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "attendees_update_all" ON attendees;
CREATE POLICY "attendees_update_all" ON attendees FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "attendees_delete_all" ON attendees;
CREATE POLICY "attendees_delete_all" ON attendees FOR DELETE
  TO anon, authenticated USING (true);

-- checkins policies
DROP POLICY IF EXISTS "checkins_select_all" ON checkins;
CREATE POLICY "checkins_select_all" ON checkins FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "checkins_insert_all" ON checkins;
CREATE POLICY "checkins_insert_all" ON checkins FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "checkins_update_all" ON checkins;
CREATE POLICY "checkins_update_all" ON checkins FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "checkins_delete_all" ON checkins;
CREATE POLICY "checkins_delete_all" ON checkins FOR DELETE
  TO anon, authenticated USING (true);