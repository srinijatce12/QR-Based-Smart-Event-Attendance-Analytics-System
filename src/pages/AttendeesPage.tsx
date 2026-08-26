import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Circle,
  Trash2,
  Download,
  Users,
} from 'lucide-react';
import { api } from '@/services/api';
import type { AttendeeWithCheckIn } from '@/types';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { PageHeader } from '@/layouts/AppLayout';
import { useToast } from '@/components/Toast';
import { useConfirmDialog } from '@/components/ConfirmDialog';

type SortField = 'name' | 'registered_at' | 'checked_in';
type FilterStatus = 'all' | 'checked_in' | 'not_checked_in';

export function AttendeesPage() {
  const { id } = useParams();
  const { notify } = useToast();
  const { confirm, dialog } = useConfirmDialog();
  const [attendees, setAttendees] = useState<AttendeeWithCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('registered_at');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const data = await api.getAttendees(id);
      setAttendees(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleDelete = async (attendeeId: string, name: string) => {
    const ok = await confirm('Remove attendee?', `This will remove ${name} and their check-in record. This cannot be undone.`);
    if (!ok) return;
    try {
      await api.deleteAttendee(attendeeId);
      notify('Attendee removed.', 'success');
      setAttendees((prev) => prev.filter((a) => a.id !== attendeeId));
    } catch {
      notify('Failed to remove attendee.', 'error');
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Organization', 'Department', 'Year', 'Checked In', 'Check-in Time', 'Registered At'];
    const rows = filtered.map((a) => [
      a.name,
      a.email,
      a.phone,
      a.organization ?? '',
      a.department ?? '',
      a.year ?? '',
      a.checked_in ? 'Yes' : 'No',
      a.checked_in_at ? new Date(a.checked_in_at).toLocaleString() : '',
      new Date(a.registered_at).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'attendees.csv';
    link.click();
    notify('Attendee list exported.', 'success');
  };

  const filtered = attendees
    .filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch =
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.organization ?? '').toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (filterStatus === 'checked_in') return a.checked_in;
      if (filterStatus === 'not_checked_in') return !a.checked_in;
      return true;
    })
    .sort((a, b) => {
      if (sortField === 'name') return a.name.localeCompare(b.name);
      if (sortField === 'checked_in') {
        if (a.checked_in && !b.checked_in) return -1;
        if (!a.checked_in && b.checked_in) return 1;
        return 0;
      }
      // registered_at desc
      return new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime();
    });

  if (loading) return <LoadingState message="Loading attendees..." />;
  if (error) return <ErrorState message="Unable to load attendees." />;

  const checkedInCount = attendees.filter((a) => a.checked_in).length;

  return (
    <div>
      <Link
        to={`/events/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Event
      </Link>

      <PageHeader
        title="Attendees"
        subtitle={`${attendees.length} registered · ${checkedInCount} checked in`}
        action={
          <button
            onClick={exportCSV}
            disabled={attendees.length === 0}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        }
      />

      {/* Search + filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
        >
          <option value="all">All attendees</option>
          <option value="checked_in">Checked in only</option>
          <option value="not_checked_in">Not checked in</option>
        </select>
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
        >
          <option value="registered_at">Sort: Newest first</option>
          <option value="name">Sort: Name (A-Z)</option>
          <option value="checked_in">Sort: Check-in status</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title={attendees.length === 0 ? 'No attendees yet' : 'No matching attendees'}
          message={attendees.length === 0 ? 'Share the registration link to start collecting sign-ups.' : 'Try a different search or filter.'}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:block">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Organization</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Dept</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Year</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Check-in Time</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{a.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{a.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{a.phone}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{a.organization ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{a.department ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{a.year ?? '—'}</td>
                    <td className="px-4 py-3">
                      {a.checked_in ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Checked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          <Circle className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {a.checked_in_at ? new Date(a.checked_in_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(a.id, a.name)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{a.name}</p>
                    <p className="text-sm text-slate-500">{a.email}</p>
                  </div>
                  {a.checked_in ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> In
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      <Circle className="h-3 w-3" /> Pending
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <p>{a.phone}</p>
                  <p>{a.organization ?? '—'} · {a.department ?? '—'} · {a.year ?? '—'}</p>
                  {a.checked_in_at && (
                    <p className="text-emerald-600">Checked in: {new Date(a.checked_in_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(a.id, a.name)}
                  className="mt-3 flex items-center gap-1 text-xs font-medium text-rose-500 hover:text-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      {dialog}
    </div>
  );
}
