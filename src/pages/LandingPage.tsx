import { Link } from 'react-router-dom';
import {
  QrCode,
  ScanLine,
  CalendarDays,
  BarChart3,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const features = [
  {
    icon: QrCode,
    title: 'Unique QR Codes',
    desc: 'Every event and attendee gets a secure, unique QR code for instant identification.',
  },
  {
    icon: ScanLine,
    title: 'Live Camera Scanning',
    desc: 'Scan attendee QR codes with any device camera. Fast, reliable, mobile-ready.',
  },
  {
    icon: ShieldCheck,
    title: 'Duplicate Prevention',
    desc: 'Database-level enforcement ensures no attendee checks in twice for the same event.',
  },
  {
    icon: BarChart3,
    title: 'Attendance Analytics',
    desc: 'Real-time dashboards with check-in trends, registration rates, and event comparisons.',
  },
  {
    icon: Users,
    title: 'Attendee Management',
    desc: 'Search, filter, and sort your full attendee list with live check-in status.',
  },
  {
    icon: Zap,
    title: 'Instant Check-Ins',
    desc: 'From registration to check-in in seconds. Built for high-traffic event entry.',
  },
];

const steps = [
  { num: '01', title: 'Create an Event', desc: 'Set up your event with date, venue, and capacity in seconds.' },
  { num: '02', title: 'Share the QR', desc: 'Display the event QR or registration link for attendees to sign up.' },
  { num: '03', title: 'Register Attendees', desc: 'Attendees fill a quick form and get their own unique QR code.' },
  { num: '04', title: 'Scan & Check In', desc: 'Open the scanner, point at the attendee QR, and check them in instantly.' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600">
              <QrCode className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">SmartCheck</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">Features</a>
            <a href="#how" className="text-sm font-medium text-slate-600 hover:text-slate-900">How it Works</a>
            <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900">Dashboard</Link>
          </nav>
          <Link
            to="/dashboard"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50 via-white to-white" />
        <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-24 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5">
            <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-sm font-medium text-sky-700">QR-powered event check-in</span>
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Check in your attendees with a{' '}
            <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              single scan
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">
            SmartCheck handles event registration, QR code generation, live camera scanning,
            and attendance analytics — all in one place.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/events/new"
              className="flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-700 transition-colors"
            >
              <CalendarDays className="h-5 w-5" />
              Create Event
            </Link>
            <Link
              to="/scanner"
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ScanLine className="h-5 w-5" />
              Scan QR
            </Link>
          </div>

          {/* Stats strip */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-4">
            {[
              { label: 'Events Managed', value: '∞' },
              { label: 'Check-in Speed', value: '<1s' },
              { label: 'Duplicate Rate', value: '0%' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <p className="text-3xl font-bold text-slate-900">{s.value}</p>
                <p className="mt-1 text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900">Everything you need to run check-in</h2>
          <p className="mt-3 text-slate-600">From registration to analytics, SmartCheck covers the full flow.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-sky-200"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-100">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-slate-900 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white">How it works</h2>
            <p className="mt-3 text-slate-400">Four steps from setup to check-in.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.num} className="rounded-2xl bg-slate-800 p-6">
                <span className="text-3xl font-bold text-sky-500">{s.num}</span>
                <h3 className="mt-3 text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="rounded-3xl bg-gradient-to-br from-sky-600 to-blue-600 p-12">
          <h2 className="text-3xl font-bold text-white">Ready to run your event?</h2>
          <p className="mt-3 text-sky-100">Create your first event and start checking in attendees in minutes.</p>
          <Link
            to="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-sky-700 hover:bg-sky-50 transition-colors"
          >
            Open Dashboard
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-slate-400" />
            <span className="text-sm font-semibold text-slate-600">SmartCheck</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            QR-based event check-in & attendance analytics
          </div>
        </div>
      </footer>
    </div>
  );
}
