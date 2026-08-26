import { supabase } from './supabase';

import type {
  Event,
  NewEvent,
  Attendee,
  NewAttendee,
  CheckIn,
  AttendeeWithCheckIn,
  EventStats,
  EventDetailStats,
  CheckInResult,
} from '@/types';

/* =========================================================
   QR TOKEN GENERATOR
========================================================= */

function generateToken(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);

  return Array.from(
    arr,
    (b) => b.toString(16).padStart(2, '0')
  ).join('');
}

/* =========================================================
   QR PAYLOAD PARSER
========================================================= */

function extractQRToken(qrValue: string): string {
  const value = qrValue.trim();

  if (!value) {
    return '';
  }

  try {
    const parsed = JSON.parse(value);

    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.token === 'string'
    ) {
      return parsed.token.trim();
    }
  } catch {
    // Raw token
  }

  return value;
}

/* =========================================================
   EVENT PAYLOAD
   IMPORTANT:
   Database column is maximum_capacity
========================================================= */

function buildEventPayload(
  payload: NewEvent
): Record<string, unknown> {
  return {
    name: payload.name,
    date: payload.date,
    start_time: payload.start_time,
    end_time: payload.end_time,
    venue: payload.venue,
    description: payload.description || null,
    organizer_name: payload.organizer_name || null,
    maximum_capacity:
      payload.maximum_capacity ?? null,
  };
}

/* =========================================================
   API
========================================================= */

export const api = {

  /* =======================================================
     EVENTS
  ======================================================= */

  async getEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      console.error('getEvents error:', error);
      throw new Error(error.message);
    }

    return data ?? [];
  },

  /* =======================================================
     GET SINGLE EVENT
  ======================================================= */

  async getEvent(
    id: string
  ): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('getEvent error:', error);
      throw new Error(error.message);
    }

    return data;
  },

  /* =======================================================
     CREATE EVENT
  ======================================================= */

  async createEvent(
    payload: NewEvent
  ): Promise<Event> {

    const eventData = buildEventPayload(payload);

    console.log(
      'Creating event:',
      eventData
    );

    const {
      data,
      error,
    } = await supabase
      .from('events')
      .insert(eventData)
      .select('*')
      .single();

    if (error) {
      console.error(
        'Supabase create event error:',
        error
      );

      throw new Error(
        `Failed to create event: ${error.message}`
      );
    }

    return data;
  },

  /* =======================================================
     UPDATE EVENT
  ======================================================= */

  async updateEvent(
    id: string,
    payload: Partial<NewEvent>
  ): Promise<Event> {

    const eventData: Record<
      string,
      unknown
    > = {};

    if (payload.name !== undefined) {
      eventData.name = payload.name;
    }

    if (payload.date !== undefined) {
      eventData.date = payload.date;
    }

    if (payload.start_time !== undefined) {
      eventData.start_time =
        payload.start_time;
    }

    if (payload.end_time !== undefined) {
      eventData.end_time =
        payload.end_time;
    }

    if (payload.venue !== undefined) {
      eventData.venue = payload.venue;
    }

    if (payload.description !== undefined) {
      eventData.description =
        payload.description || null;
    }

    if (
      payload.organizer_name !== undefined
    ) {
      eventData.organizer_name =
        payload.organizer_name || null;
    }

    if (
      payload.maximum_capacity !== undefined
    ) {
      eventData.maximum_capacity =
        payload.maximum_capacity;
    }

    eventData.updated_at =
      new Date().toISOString();

    const {
      data,
      error,
    } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error(
        'Supabase update event error:',
        error
      );

      throw new Error(
        `Failed to update event: ${error.message}`
      );
    }

    return data;
  },

  /* =======================================================
     DELETE EVENT
  ======================================================= */

  async deleteEvent(
    id: string
  ): Promise<void> {

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(
        'deleteEvent error:',
        error
      );

      throw new Error(error.message);
    }
  },

  /* =======================================================
     ATTENDEES
  ======================================================= */

  async getAttendees(
    eventId: string
  ): Promise<AttendeeWithCheckIn[]> {

    const {
      data: attendees,
      error,
    } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', eventId)
      .order('registered_at', {
        ascending: false,
      });

    if (error) {
      console.error(
        'getAttendees error:',
        error
      );

      throw new Error(error.message);
    }

    if (
      !attendees ||
      attendees.length === 0
    ) {
      return [];
    }

    const {
      data: checkins,
      error: checkinError,
    } = await supabase
      .from('checkins')
      .select(
        'attendee_id, checked_in_at'
      )
      .eq('event_id', eventId);

    if (checkinError) {
      console.error(
        'getAttendees checkins error:',
        checkinError
      );

      throw new Error(
        checkinError.message
      );
    }

    const checkinMap =
      new Map<string, string>();

    (checkins ?? []).forEach(
      (c: {
        attendee_id: string;
        checked_in_at: string;
      }) => {
        checkinMap.set(
          c.attendee_id,
          c.checked_in_at
        );
      }
    );

    return attendees.map((a) => ({
      ...a,

      checked_in:
        checkinMap.has(a.id),

      checked_in_at:
        checkinMap.get(a.id) ?? null,
    }));
  },

  /* =======================================================
     REGISTER ATTENDEE
  ======================================================= */

  async registerAttendee(
    payload: NewAttendee
  ): Promise<Attendee> {

    const qr_token =
      generateToken();

    const {
      data,
      error,
    } = await supabase
      .from('attendees')
      .insert({
        ...payload,
        qr_token,
      })
      .select('*')
      .single();

    if (error) {
      console.error(
        'registerAttendee error:',
        error
      );

      throw new Error(
        `Failed to register attendee: ${error.message}`
      );
    }

    return data;
  },

  /* =======================================================
     GET ATTENDEE BY QR TOKEN
  ======================================================= */

  async getAttendeeByToken(
    qrToken: string
  ): Promise<Attendee | null> {

    const token =
      extractQRToken(qrToken);

    if (!token) {
      return null;
    }

    const {
      data,
      error,
    } = await supabase
      .from('attendees')
      .select('*')
      .eq('qr_token', token)
      .maybeSingle();

    if (error) {
      console.error(
        'getAttendeeByToken error:',
        error
      );

      throw new Error(error.message);
    }

    return data;
  },

  /* =======================================================
     DELETE ATTENDEE
  ======================================================= */

  async deleteAttendee(
    id: string
  ): Promise<void> {

    const { error } =
      await supabase
        .from('attendees')
        .delete()
        .eq('id', id);

    if (error) {
      console.error(
        'deleteAttendee error:',
        error
      );

      throw new Error(error.message);
    }
  },

  /* =======================================================
     CHECK-INS
  ======================================================= */

  async getCheckins(
    eventId: string
  ): Promise<CheckIn[]> {

    const {
      data,
      error,
    } = await supabase
      .from('checkins')
      .select('*')
      .eq('event_id', eventId)
      .order('checked_in_at', {
        ascending: false,
      });

    if (error) {
      console.error(
        'getCheckins error:',
        error
      );

      throw new Error(error.message);
    }

    return data ?? [];
  },

  /* =======================================================
     RECENT CHECK-INS
  ======================================================= */

  async getRecentCheckins(
    limit = 5
  ): Promise<
    {
      id: string;
      event_id: string;
      attendee_id: string;
      checked_in_at: string;
      attendee_name: string;
      event_name: string;
    }[]
  > {

    const {
      data: checkins,
      error,
    } = await supabase
      .from('checkins')
      .select(
        'id, event_id, attendee_id, checked_in_at'
      )
      .order('checked_in_at', {
        ascending: false,
      })
      .limit(limit);

    if (error) {
      console.error(
        'getRecentCheckins error:',
        error
      );

      throw new Error(error.message);
    }

    if (
      !checkins ||
      checkins.length === 0
    ) {
      return [];
    }

    const attendeeIds = [
      ...new Set(
        checkins.map(
          (c) => c.attendee_id
        )
      ),
    ];

    const eventIds = [
      ...new Set(
        checkins.map(
          (c) => c.event_id
        )
      ),
    ];

    const {
      data: attendees,
      error: attendeeError,
    } = await supabase
      .from('attendees')
      .select('id, name')
      .in('id', attendeeIds);

    if (attendeeError) {
      throw new Error(
        attendeeError.message
      );
    }

    const {
      data: events,
      error: eventError,
    } = await supabase
      .from('events')
      .select('id, name')
      .in('id', eventIds);

    if (eventError) {
      throw new Error(
        eventError.message
      );
    }

    const attendeeMap =
      new Map(
        (attendees ?? []).map(
          (a) => [a.id, a.name]
        )
      );

    const eventMap =
      new Map(
        (events ?? []).map(
          (e) => [e.id, e.name]
        )
      );

    return checkins.map((c) => ({
      ...c,

      attendee_name:
        attendeeMap.get(
          c.attendee_id
        ) ?? 'Unknown',

      event_name:
        eventMap.get(
          c.event_id
        ) ?? 'Unknown',
    }));
  },

  /* =======================================================
     CHECK IN ATTENDEE
  ======================================================= */

  async checkIn(
    qrValue: string,
    eventId: string
  ): Promise<CheckInResult> {

    const qrToken =
      extractQRToken(qrValue);

    if (!qrToken) {
      return {
        success: false,
        message: 'Invalid QR code.',
      };
    }

    /* -----------------------------------------------------
       FIND ATTENDEE
    ----------------------------------------------------- */

    const attendee =
      await this.getAttendeeByToken(
        qrToken
      );

    if (!attendee) {
      return {
        success: false,
        message:
          'Invalid QR code. No attendee found for this token.',
      };
    }

    /* -----------------------------------------------------
       CHECK EVENT
    ----------------------------------------------------- */

    if (
      attendee.event_id !== eventId
    ) {
      return {
        success: false,
        message:
          'This attendee is not registered for the selected event.',
      };
    }

    /* -----------------------------------------------------
       CHECK DUPLICATE
    ----------------------------------------------------- */

    const {
      data: existing,
      error: existingError,
    } = await supabase
      .from('checkins')
      .select(
        'id, checked_in_at'
      )
      .eq('event_id', eventId)
      .eq(
        'attendee_id',
        attendee.id
      )
      .maybeSingle();

    if (existingError) {
      throw new Error(
        existingError.message
      );
    }

    if (existing) {
      return {
        success: false,
        already_checked_in: true,

        message:
          'Already Checked In',

        attendee: {
          name: attendee.name,
          email: attendee.email,
        },

        checked_in_at:
          existing.checked_in_at,
      };
    }

    /* -----------------------------------------------------
       GET EVENT
    ----------------------------------------------------- */

    const {
      data: event,
      error: eventError,
    } = await supabase
      .from('events')
      .select('name')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError) {
      throw new Error(
        eventError.message
      );
    }

    /* -----------------------------------------------------
       CREATE CHECK-IN
    ----------------------------------------------------- */

    const {
      data: checkin,
      error: checkinError,
    } = await supabase
      .from('checkins')
      .insert({
        event_id: eventId,
        attendee_id: attendee.id,
      })
      .select('*')
      .single();

    if (checkinError) {

      /* Duplicate protection */

      if (
        checkinError.code ===
        '23505'
      ) {
        return {
          success: false,
          already_checked_in: true,

          message:
            'Already Checked In',

          attendee: {
            name: attendee.name,
            email: attendee.email,
          },
        };
      }

      throw new Error(
        checkinError.message
      );
    }

    /* -----------------------------------------------------
       SUCCESS
    ----------------------------------------------------- */

    return {
      success: true,

      message:
        'Check-in Successful',

      attendee: {
        name: attendee.name,
        email: attendee.email,
      },

      event_name:
        event?.name ?? 'Event',

      checked_in_at:
        checkin.checked_in_at,
    };
  },

  /* =======================================================
     DASHBOARD STATISTICS
  ======================================================= */

  async getDashboardStats():
    Promise<EventStats> {

    const {
      count: total_events,
      error: eErr,
    } = await supabase
      .from('events')
      .select('*', {
        count: 'exact',
        head: true,
      });

    if (eErr) {
      throw new Error(
        eErr.message
      );
    }

    const {
      count: total_attendees,
      error: aErr,
    } = await supabase
      .from('attendees')
      .select('*', {
        count: 'exact',
        head: true,
      });

    if (aErr) {
      throw new Error(
        aErr.message
      );
    }

    const {
      count: total_checkins,
      error: cErr,
    } = await supabase
      .from('checkins')
      .select('*', {
        count: 'exact',
        head: true,
      });

    if (cErr) {
      throw new Error(
        cErr.message
      );
    }

    const events =
      total_events ?? 0;

    const attendees =
      total_attendees ?? 0;

    const checkins =
      total_checkins ?? 0;

    const rate =
      attendees > 0
        ? Math.round(
            (checkins / attendees) *
              100
          )
        : 0;

    return {
      total_events: events,
      total_attendees: attendees,
      total_checkins: checkins,
      attendance_rate: rate,
    };
  },

  /* =======================================================
     EVENT STATISTICS
  ======================================================= */

  async getEventStats(
    eventId: string
  ): Promise<EventDetailStats> {

    const {
      count: registered,
      error: aErr,
    } = await supabase
      .from('attendees')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('event_id', eventId);

    if (aErr) {
      throw new Error(
        aErr.message
      );
    }

    const {
      count: checked_in,
      error: cErr,
    } = await supabase
      .from('checkins')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('event_id', eventId);

    if (cErr) {
      throw new Error(
        cErr.message
      );
    }

    const reg =
      registered ?? 0;

    const chk =
      checked_in ?? 0;

    return {
      registered: reg,
      checked_in: chk,
      absent: reg - chk,

      attendance_rate:
        reg > 0
          ? Math.round(
              (chk / reg) * 100
            )
          : 0,
    };
  },

  /* =======================================================
     CHECK-IN TREND
  ======================================================= */

  async getEventCheckinTrend(
    eventId: string
  ): Promise<
    {
      time: string;
      count: number;
    }[]
  > {

    const {
      data,
      error,
    } = await supabase
      .from('checkins')
      .select('checked_in_at')
      .eq('event_id', eventId)
      .order('checked_in_at', {
        ascending: true,
      });

    if (error) {
      throw new Error(
        error.message
      );
    }

    if (
      !data ||
      data.length === 0
    ) {
      return [];
    }

    const buckets =
      new Map<string, number>();

    data.forEach(
      (c: {
        checked_in_at: string;
      }) => {

        const d =
          new Date(
            c.checked_in_at
          );

        const key =
          d.toLocaleString(
            'en-US',
            {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }
          );

        buckets.set(
          key,
          (buckets.get(key) ?? 0) +
            1
        );
      }
    );

    let cumulative = 0;

    return Array.from(
      buckets.entries()
    ).map(
      ([time, count]) => {

        cumulative += count;

        return {
          time,
          count: cumulative,
        };
      }
    );
  },

  /* =======================================================
     REGISTRATION TREND
  ======================================================= */

  async getRegistrationTrend(
    eventId: string
  ): Promise<
    {
      time: string;
      count: number;
    }[]
  > {

    const {
      data,
      error,
    } = await supabase
      .from('attendees')
      .select('registered_at')
      .eq('event_id', eventId)
      .order('registered_at', {
        ascending: true,
      });

    if (error) {
      throw new Error(
        error.message
      );
    }

    if (
      !data ||
      data.length === 0
    ) {
      return [];
    }

    const buckets =
      new Map<string, number>();

    data.forEach(
      (a: {
        registered_at: string;
      }) => {

        const d =
          new Date(
            a.registered_at
          );

        const key =
          d.toLocaleDateString(
            'en-US',
            {
              month: 'short',
              day: 'numeric',
            }
          );

        buckets.set(
          key,
          (buckets.get(key) ?? 0) +
            1
        );
      }
    );

    let cumulative = 0;

    return Array.from(
      buckets.entries()
    ).map(
      ([time, count]) => {

        cumulative += count;

        return {
          time,
          count: cumulative,
        };
      }
    );
  },

  /* =======================================================
     EVENT COMPARISON
  ======================================================= */

  async getEventComparison(): Promise<
    {
      name: string;
      registered: number;
      checked_in: number;
    }[]
  > {

    const {
      data: events,
      error,
    } = await supabase
      .from('events')
      .select('id, name')
      .order('created_at', {
        ascending: false,
      })
      .limit(10);

    if (error) {
      throw new Error(
        error.message
      );
    }

    if (
      !events ||
      events.length === 0
    ) {
      return [];
    }

    const result: {
      name: string;
      registered: number;
      checked_in: number;
    }[] = [];

    for (const event of events) {

      const {
        count: registered,
        error: registeredError,
      } = await supabase
        .from('attendees')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq(
          'event_id',
          event.id
        );

      if (registeredError) {
        throw new Error(
          registeredError.message
        );
      }

      const {
        count: checked_in,
        error: checkedInError,
      } = await supabase
        .from('checkins')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq(
          'event_id',
          event.id
        );

      if (checkedInError) {
        throw new Error(
          checkedInError.message
        );
      }

      result.push({
        name:
          event.name.length > 20
            ? event.name.slice(
                0,
                20
              ) + '…'
            : event.name,

        registered:
          registered ?? 0,

        checked_in:
          checked_in ?? 0,
      });
    }

    return result;
  },

  /* =======================================================
     PEAK CHECK-IN PERIOD
  ======================================================= */

  async getPeakCheckinPeriod(): Promise<
    {
      hour: string;
      count: number;
    }[]
  > {

    const {
      data,
      error,
    } = await supabase
      .from('checkins')
      .select('checked_in_at')
      .order('checked_in_at', {
        ascending: false,
      })
      .limit(500);

    if (error) {
      throw new Error(
        error.message
      );
    }

    if (
      !data ||
      data.length === 0
    ) {
      return [];
    }

    const hourCounts =
      new Map<string, number>();

    data.forEach(
      (c: {
        checked_in_at: string;
      }) => {

        const d =
          new Date(
            c.checked_in_at
          );

        const key =
          `${d
            .getHours()
            .toString()
            .padStart(2, '0')}:00`;

        hourCounts.set(
          key,
          (hourCounts.get(key) ?? 0) +
            1
        );
      }
    );

    return Array.from(
      hourCounts.entries()
    )
      .map(
        ([hour, count]) => ({
          hour,
          count,
        })
      )
      .sort(
        (a, b) =>
          a.hour.localeCompare(
            b.hour
          )
      );
  },
};

