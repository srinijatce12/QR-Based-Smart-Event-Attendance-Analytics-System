import { useState } from 'react';
import { User, Building2, Save, Info } from 'lucide-react';
import { PageHeader } from '@/layouts/AppLayout';
import { useToast } from '@/components/Toast';

export function SettingsPage() {
  const { notify } = useToast();
  const [organizer, setOrganizer] = useState({
    name: '',
    email: '',
    organization: '',
  });

  const handleSave = () => {
    if (!organizer.name) {
      notify('Please enter your name.', 'error');
      return;
    }
    notify('Settings saved successfully.', 'success');
  };

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100';
  const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your organizer profile and preferences" />

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Organizer info */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-semibold text-slate-900">Organizer Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                value={organizer.name}
                onChange={(e) => setOrganizer((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. John Smith"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={organizer.email}
                onChange={(e) => setOrganizer((p) => ({ ...p, email: e.target.value }))}
                placeholder="john@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Organization</label>
              <input
                type="text"
                value={organizer.organization}
                onChange={(e) => setOrganizer((p) => ({ ...p, organization: e.target.value }))}
                placeholder="e.g. State University"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* App info */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Application</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-600">Application Name</span>
              <span className="text-sm font-medium text-slate-900">SmartCheck</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-600">Version</span>
              <span className="text-sm font-medium text-slate-900">1.0.0</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-600">QR Code Format</span>
              <span className="text-sm font-medium text-slate-900">JSON payload</span>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 shrink-0 text-sky-600" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">About SmartCheck</h3>
              <p className="mt-1 text-sm text-slate-600">
                SmartCheck is a QR-based event check-in and attendance analytics platform.
                Create events, generate unique QR codes, register attendees, scan QR codes
                for instant check-in, and view real-time attendance analytics.
              </p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
