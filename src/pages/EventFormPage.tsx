import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '@/services/api';
import type { NewEvent } from '@/types';
import { LoadingState, ErrorState } from '@/components/States';
import { PageHeader } from '@/layouts/AppLayout';
import { useToast } from '@/components/Toast';

const empty: NewEvent = {
  name: '',
  description: '',
  date: '',
  start_time: '09:00',
  end_time: '17:00',
  venue: '',
  organizer_name: '',
  capacity: 100,
};

export function EventFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { notify } = useToast();
  const [form, setForm] = useState<NewEvent>(empty);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const e = await api.getEvent(id!);
        if (e) {
          setForm({
            name: e.name,
            description: e.description ?? '',
            date: e.date,
            start_time: e.start_time,
            end_time: e.end_time,
            venue: e.venue,
            organizer_name: e.organizer_name,
            capacity: e.capacity,
          });
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const update = (field: keyof NewEvent, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.date || !form.venue || !form.organizer_name) {
      notify('Please fill in all required fields.', 'error');
      return;
    }
    if (form.end_time <= form.start_time) {
      notify('End time must be after start time.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.updateEvent(id!, form);
        notify('Event updated successfully.', 'success');
        navigate(`/events/${id}`);
      } else {
        const created = await api.createEvent(form);
        notify('Event created successfully.', 'success');
        navigate(`/events/${created.id}`);
      }
    } catch {
      notify('Failed to save event. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading event..." />;
  if (error) return <ErrorState message="Unable to load this event." />;

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100';
  const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to={isEdit ? `/events/${id}` : '/events'}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <PageHeader title={isEdit ? 'Edit Event' : 'Create Event'} subtitle={isEdit ? 'Update event details' : 'Set up a new event for check-in'} />

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div>
          <label className={labelClass}>Event Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. Tech Conference 2026"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Brief description of the event"
            rows={3}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Date *</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => update('date', e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Start Time *</label>
            <input
              type="time"
              required
              value={form.start_time}
              onChange={(e) => update('start_time', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>End Time *</label>
            <input
              type="time"
              required
              value={form.end_time}
              onChange={(e) => update('end_time', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Venue *</label>
          <input
            type="text"
            required
            value={form.venue}
            onChange={(e) => update('venue', e.target.value)}
            placeholder="e.g. Main Auditorium, Building A"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Organizer Name *</label>
          <input
            type="text"
            required
            value={form.organizer_name}
            onChange={(e) => update('organizer_name', e.target.value)}
            placeholder="e.g. John Smith"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Maximum Capacity *</label>
          <input
            type="number"
            required
            min={1}
            value={form.capacity}
            onChange={(e) => update('capacity', parseInt(e.target.value) || 1)}
            className={inputClass}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/events/${id}` : '/events')}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}
