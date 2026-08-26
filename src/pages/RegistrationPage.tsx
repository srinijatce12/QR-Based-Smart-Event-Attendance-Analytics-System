import { useState, useEffect, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  CalendarDays,
  MapPin,
} from 'lucide-react';

import { api } from '@/services/api';
import type { Event, Attendee, NewAttendee } from '@/types';
import { LoadingState, ErrorState } from '@/components/States';
import { useToast } from '@/components/Toast';

const emptyForm: NewAttendee = {
  event_id: '',
  name: '',
  email: '',
  phone: '',
  organization: '',
  department: '',
  year: '',
};

export function RegistrationPage() {
  const { id } = useParams();
  const { notify } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [form, setForm] = useState<NewAttendee>({
    ...emptyForm,
    event_id: id ?? '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState<Attendee | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const e = await api.getEvent(id);
        setEvent(e);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const update = (field: keyof NewAttendee, value: string) =>
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.phone) {
      notify('Please fill in all required fields.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const attendee = await api.registerAttendee(form);

      setRegistered(attendee);

      notify('Registration successful!', 'success');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.';

      notify(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadAttendeeQR = () => {
    if (!registered) return;

    const svg = document.getElementById('attendee-qr');

    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;

      if (ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 400, 400);
        ctx.drawImage(img, 0, 0, 400, 400);
      }

      const link = document.createElement('a');

      link.download =
        `${registered.name.replace(/\s+/g, '-')}-QR.png`;

      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src =
      'data:image/svg+xml;base64,' +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  if (loading) {
    return <LoadingState message="Loading registration..." />;
  }

  if (error || !event) {
    return (
      <ErrorState message="Unable to load this event for registration." />
    );
  }

  // =====================================================
  // SUCCESS SCREEN
  // =====================================================

  if (registered) {
    // IMPORTANT:
    // QR contains ONLY the Supabase qr_token.
    const qrPayload = registered.qr_token;

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-lg">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Registration Successful!
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            You're registered for{' '}
            <span className="font-semibold">
              {event.name}
            </span>
          </p>

          {/* QR CODE */}
          <div className="mt-6 inline-block rounded-2xl border-2 border-slate-100 bg-white p-4">
            <QRCodeSVG
              id="attendee-qr"
              value={qrPayload}
              size={180}
              level="M"
              includeMargin
            />
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Save this QR code — you'll need it to check in at the event.
          </p>

          {/* ATTENDEE DETAILS */}
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-left">
            <p className="text-sm font-medium text-slate-700">
              {registered.name}
            </p>

            <p className="text-xs text-slate-500">
              {registered.email}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Token: {registered.qr_token.slice(0, 12)}...
            </p>
          </div>

          {/* BUTTONS */}
          <div className="mt-6 space-y-2">

            <button
              onClick={downloadAttendeeQR}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
            >
              <Download className="h-4 w-4" />
              Download My QR Code
            </button>

            <button
              onClick={() => {
                setRegistered(null);

                setForm({
                  ...emptyForm,
                  event_id: id ?? '',
                });
              }}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Register Another Attendee
            </button>

          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // REGISTRATION FORM
  // =====================================================

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100';

  const labelClass =
    'mb-1.5 block text-sm font-medium text-slate-700';

  return (
    <div className="min-h-screen bg-slate-50">

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600">
            <span className="text-xs font-bold text-white">
              SC
            </span>
          </div>

          <span className="font-bold text-slate-900">
            SmartCheck
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">

        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* EVENT INFO */}
        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <h1 className="text-xl font-bold text-slate-900">
            {event.name}
          </h1>

          {event.description && (
            <p className="mt-1 text-sm text-slate-500">
              {event.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">

            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-slate-400" />

              {new Date(
                event.date + 'T00:00:00'
              ).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>

            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-slate-400" />
              {event.venue}
            </span>

          </div>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
        >

          <h2 className="text-lg font-semibold text-slate-900">
            Register for this event
          </h2>

          <div>
            <label className={labelClass}>
              Full Name *
            </label>

            <input
              type="text"
              required
              value={form.name}
              onChange={(e) =>
                update('name', e.target.value)
              }
              placeholder="e.g. Jane Doe"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            <div>
              <label className={labelClass}>
                Email *
              </label>

              <input
                type="email"
                required
                value={form.email}
                onChange={(e) =>
                  update('email', e.target.value)
                }
                placeholder="jane@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Phone Number *
              </label>

              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) =>
                  update('phone', e.target.value)
                }
                placeholder="+1 234 567 890"
                className={inputClass}
              />
            </div>

          </div>

          <div>
            <label className={labelClass}>
              College / Organization
            </label>

            <input
              type="text"
              value={form.organization ?? ''}
              onChange={(e) =>
                update('organization', e.target.value)
              }
              placeholder="e.g. State University"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            <div>
              <label className={labelClass}>
                Department
              </label>

              <input
                type="text"
                value={form.department ?? ''}
                onChange={(e) =>
                  update('department', e.target.value)
                }
                placeholder="e.g. Computer Science"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Year
              </label>

              <select
                value={form.year ?? ''}
                onChange={(e) =>
                  update('year', e.target.value)
                }
                className={inputClass}
              >
                <option value="">
                  Select year
                </option>
                <option value="1st">
                  1st Year
                </option>
                <option value="2nd">
                  2nd Year
                </option>
                <option value="3rd">
                  3rd Year
                </option>
                <option value="4th">
                  4th Year
                </option>
                <option value="5th">
                  5th Year
                </option>
                <option value="Graduate">
                  Graduate
                </option>
                <option value="Other">
                  Other
                </option>
              </select>
            </div>

          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {submitting
              ? 'Registering...'
              : 'Register Now'}
          </button>

        </form>
      </div>
    </div>
  );
}