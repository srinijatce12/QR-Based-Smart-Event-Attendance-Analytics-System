export interface Event {
  id: string;
  name: string;
  description: string | null;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  organizer_name: string | null;
  maximum_capacity: number | null;
  created_at: string;
  updated_at: string;
}

export interface NewEvent {
  name: string;
  description?: string | null;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  organizer_name?: string | null;
  maximum_capacity: number;
}

export interface Attendee {
  id: string;
  event_id: string;
  name: string;
  email: string;
  phone: string;
  organization: string | null;
  department: string | null;
  year: string | null;
  qr_token: string;
  registered_at: string;
}

export interface NewAttendee {
  event_id: string;
  name: string;
  email: string;
  phone: string;
  organization?: string;
  department?: string;
  year?: string;
}

export interface CheckIn {
  id: string;
  event_id: string;
  attendee_id: string;
  checked_in_at: string;
}

export interface AttendeeWithCheckIn extends Attendee {
  checked_in: boolean;
  checked_in_at: string | null;
}

export interface EventStats {
  total_events: number;
  total_attendees: number;
  total_checkins: number;
  attendance_rate: number;
}

export interface EventDetailStats {
  registered: number;
  checked_in: number;
  absent: number;
  attendance_rate: number;
}

export interface CheckInResult {
  success: boolean;
  message: string;

  attendee?: {
    name: string;
    email: string;
  };

  event_name?: string;
  checked_in_at?: string;
  already_checked_in?: boolean;
}