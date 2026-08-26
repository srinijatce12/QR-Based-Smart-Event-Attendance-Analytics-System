import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Plus,
  Search,
  Pencil,
  Trash2,
  QrCode,
  Users,
  BarChart3,
  MapPin,
  Clock,
} from 'lucide-react';
import { api } from '@/services/api';
import type { Event } from '@/types';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { PageHeader } from '@/layouts/AppLayout';
import { useToast } from '@/components/Toast';
import { useConfirmDialog } from '@/components/ConfirmDialog';

type Filter = 'all' | 'upcoming' | 'past' | 'today';

function getEventStatus(e: Event): { label: string; color: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(e.date + 'T00:00:00');
  if (eventDate.getTime() === today.getTime()) return { label: 'Today', color: 'bg-amber-100 text-amber-700' };
  if (eventDate > today) return { label: 'Upcoming', color: 'bg-sky-100 text-sky-700' };
  return { label: 'Past', color: 'bg-slate-100 text-slate-600' };
}

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const { notify } = useToast();
  const { confirm, dialog } = useConfirmDialog();

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm('Delete event?', `This will permanently delete "${name}" and all its attendees and check-ins. This cannot be undone.`);
    if (!ok) return;
    try {
      await api.deleteEvent(id);
      notify('Event deleted successfully.', 'success');
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch {
      notify('Failed to delete event. Please try again.', 'error');
    }
  };

  const filtered = events.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(e.date + 'T00:00:00');
    if (filter === 'upcoming') return eventDate > today;
    if (filter === 'past') return eventDate < today;
    if (filter === 'today') return eventDate.getTime() === today.getTime();
    return true;
  });

  if (loading) return <LoadingState message="Loading events..." />;
  if (error) return <ErrorState message="Unable to load events. Please try again." />;

  return (
    <div>
      <PageHeader
        title="Events"
        subtitle={`${events.length} ${events.length === 1 ? 'event' : 'events'} total`}
        action={
          <Link
            to="/events/new"
            className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
        }
      />

      {/* Search + filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'upcoming', 'today', 'past'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-7 w-7" />}
          title={events.length === 0 ? 'No events created yet' : 'No matching events'}
          message={events.length === 0 ? 'Create your first event to start managing check-ins.' : 'Try a different search or filter.'}
          action={
            events.length === 0 ? (
              <Link
                to="/events/new"
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                <Plus className="h-4 w-4" /> Create Event
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => {
            const status = getEventStatus(e);
            return (
              <div
                key={e.id}
                className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <Link to={`/events/${e.id}`}>
                      <h3 className="truncate text-lg font-semibold text-slate-900 hover:text-sky-600">{e.name}</h3>
                    </Link>
                    <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>

                {e.description && (
                  <p className="mb-3 line-clamp-2 text-sm text-slate-500">{e.description}</p>
                )}

                <div className="mb-4 space-y-1.5 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    {e.start_time} – {e.end_time}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{e.venue}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <Link
                    to={`/events/${e.id}`}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <Users className="h-3.5 w-3.5" /> View
                  </Link>
                  <Link
                    to={`/events/${e.id}/edit`}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Link>
                  <Link
                    to={`/events/${e.id}#qr`}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <QrCode className="h-3.5 w-3.5" /> QR
                  </Link>
                  <Link
                    to={`/events/${e.id}/attendees`}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <Users className="h-3.5 w-3.5" /> Attendees
                  </Link>
                  <Link
                    to={`/analytics?event=${e.id}`}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <BarChart3 className="h-3.5 w-3.5" /> Stats
                  </Link>
                  <button
                    onClick={() => handleDelete(e.id, e.name)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {dialog}
    </div>
  );
}
