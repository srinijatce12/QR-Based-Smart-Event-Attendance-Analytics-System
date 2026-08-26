import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Users,
  CheckCircle2,
  TrendingUp,
  Plus,
  ScanLine,
  ArrowRight,
  Clock,
  BarChart3,
} from 'lucide-react';
import { api } from '@/services/api';
import type { EventStats, Event } from '@/types';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { PageHeader } from '@/layouts/AppLayout';

interface RecentCheckIn {
  id: string;
  attendee_name: string;
  event_name: string;
  checked_in_at: string;
}

export function DashboardPage() {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [recentCheckins, setRecentCheckins] = useState<RecentCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, e, r] = await Promise.all([
          api.getDashboardStats(),
          api.getEvents(),
          api.getRecentCheckins(5),
        ]);
        setStats(s);
        setEvents(e.slice(0, 5));
        setRecentCheckins(r as RecentCheckIn[]);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error || !stats)
    return (
      <ErrorState message="We couldn't load your dashboard data. Please try again." />
    );

  const statCards = [
    { label: 'Total Events', value: stats.total_events, icon: CalendarDays, color: 'sky' },
    { label: 'Total Attendees', value: stats.total_attendees, icon: Users, color: 'blue' },
    { label: 'Total Check-ins', value: stats.total_checkins, icon: CheckCircle2, color: 'emerald' },
    { label: 'Attendance Rate', value: `${stats.attendance_rate}%`, icon: TrendingUp, color: 'amber' },
  ];

  const colorMap: Record<string, string> = {
    sky: 'bg-sky-50 text-sky-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your events and attendance"
        action={
          <div className="flex gap-2">
            <Link
              to="/scanner"
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ScanLine className="h-4 w-4" />
              Scan QR
            </Link>
            <Link
              to="/events/new"
              className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Link>
          </div>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[card.color]}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-1 text-sm text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent events */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Events</h2>
            <Link to="/events" className="flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {events.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-7 w-7" />}
              title="No events yet"
              message="Create your first event to get started."
              action={
                <Link
                  to="/events/new"
                  className="mt-2 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  <Plus className="h-4 w-4" /> Create Event
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {events.map((e) => (
                <Link
                  key={e.id}
                  to={`/events/${e.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{e.name}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {e.venue}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent check-ins */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Check-ins</h2>
            <Link to="/analytics" className="flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700">
              Analytics <BarChart3 className="h-4 w-4" />
            </Link>
          </div>
          {recentCheckins.length === 0 ? (
            <EmptyState
              icon={<Clock className="h-7 w-7" />}
              title="No check-ins yet"
              message="Check-ins will appear here once attendees start arriving."
            />
          ) : (
            <div className="space-y-3">
              {recentCheckins.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{c.attendee_name}</p>
                    <p className="truncate text-sm text-slate-500">{c.event_name}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {new Date(c.checked_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
