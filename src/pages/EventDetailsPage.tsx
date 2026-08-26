import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  User,
  Users,
  CheckCircle2,
  TrendingUp,
  ScanLine,
  Download,
  Copy,
  Pencil,
  BarChart3,
} from 'lucide-react';
import { api } from '@/services/api';
import type { Event, EventDetailStats, AttendeeWithCheckIn } from '@/types';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { PageHeader } from '@/layouts/AppLayout';
import { useToast } from '@/components/Toast';

interface RecentCheckIn {
  id: string;
  attendee_id: string;
  attendee_name: string;
  checked_in_at: string;
}

export function EventDetailsPage() {
  const { id } = useParams();
  const { notify } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventDetailStats | null>(null);
  const [recent, setRecent] = useState<RecentCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const [e, s, checkins] = await Promise.all([
        api.getEvent(id),
        api.getEventStats(id),
        api.getCheckins(id),
      ]);
      setEvent(e);
      setStats(s);
      if (checkins.length > 0) {
        const attendees = await api.getAttendees(id);
        const nameMap = new Map(attendees.map((a: AttendeeWithCheckIn) => [a.id, a.name]));
        setRecent(
          checkins.slice(0, 8).map((c) => ({
            id: c.id,
            attendee_id: c.attendee_id,
            attendee_name: nameMap.get(c.attendee_id) ?? 'Unknown',
            checked_in_at: c.checked_in_at,
          }))
        );
      } else {
        setRecent([]);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <LoadingState message="Loading event..." />;
  if (error || !event || !stats)
    return <ErrorState message="Unable to load this event. It may have been deleted." />;

  const registrationUrl = `${window.location.origin}/events/${event.id}/register`;
  const qrPayload = JSON.stringify({ type: 'event', eventId: event.id });

  const copyLink = () => {
    navigator.clipboard.writeText(registrationUrl);
    notify('Registration link copied to clipboard.', 'success');
  };

  const downloadQR = () => {
    const svg = document.getElementById('event-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;
      if (ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 600, 600);
        ctx.drawImage(img, 0, 0, 600, 600);
      }
      const link = document.createElement('a');
      link.download = `${event.name.replace(/\s+/g, '-')}-QR.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      notify('QR code downloaded.', 'success');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const statCards = [
    { label: 'Registered', value: stats.registered, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Checked In', value: stats.checked_in, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Absent', value: stats.absent, icon: Users, color: 'text-slate-600 bg-slate-100' },
    { label: 'Attendance', value: `${stats.attendance_rate}%`, icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div>
      <Link
        to="/events"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>

      <PageHeader
        title={event.name}
        subtitle={`Organized by ${event.organizer_name}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/events/${event.id}/edit`}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" /> Edit
            </Link>
            <Link
              to="/scanner"
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              <ScanLine className="h-4 w-4" /> Scan QR
            </Link>
          </div>
        }
      />

      {/* Event info + QR */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Info card */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            {event.description && (
              <p className="mb-4 text-sm leading-relaxed text-slate-600">{event.description}</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Date</p>
                  <p className="text-sm font-medium text-slate-700">
                    {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Time</p>
                  <p className="text-sm font-medium text-slate-700">{event.start_time} – {event.end_time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Venue</p>
                  <p className="text-sm font-medium text-slate-700">{event.venue}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Capacity</p>
                  <p className="text-sm font-medium text-slate-700">{event.capacity} attendees</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {statCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${card.color}`}>
                  <card.icon className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Recent check-ins */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent Check-ins</h2>
              <Link
                to={`/events/${event.id}/attendees`}
                className="flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
              >
                <Users className="h-4 w-4" /> All attendees
              </Link>
            </div>
            {recent.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="h-7 w-7" />}
                title="No check-ins yet"
                message="Check-ins will appear here once attendees start arriving."
              />
            ) : (
              <div className="space-y-2">
                {recent.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-lg border border-slate-50 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{c.attendee_name}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(c.checked_in_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* QR code sidebar */}
        <div className="space-y-6" id="qr">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Event QR Code</h2>
            <div className="flex flex-col items-center">
              <div className="rounded-2xl border-2 border-slate-100 bg-white p-4">
                <QRCodeSVG id="event-qr" value={qrPayload} size={200} level="M" includeMargin />
              </div>
              <p className="mt-3 text-center text-sm text-slate-500">
                Scan this to select the event for check-in
              </p>
              <button
                onClick={downloadQR}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Download QR
              </button>
            </div>
          </div>

          {/* Registration link */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Registration Link</h2>
            <p className="mb-3 text-sm text-slate-500">Share this link with attendees to register.</p>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              <input
                type="text"
                readOnly
                value={registrationUrl}
                className="flex-1 bg-transparent text-xs text-slate-600 focus:outline-none"
              />
              <button
                onClick={copyLink}
                className="flex items-center gap-1 rounded-md bg-sky-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
              >
                <Copy className="h-3 w-3" /> Copy
              </button>
            </div>
            <Link
              to={`/events/${event.id}/register`}
              className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Open Registration Page
            </Link>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                to={`/events/${event.id}/attendees`}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Users className="h-4 w-4" /> Manage Attendees
              </Link>
              <Link
                to={`/analytics?event=${event.id}`}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <BarChart3 className="h-4 w-4" /> View Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
