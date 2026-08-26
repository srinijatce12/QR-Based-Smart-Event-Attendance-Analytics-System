import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  Users,
  CheckCircle2,
  UserX,
  TrendingUp,
  CalendarDays,
  Activity,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '@/services/api';
import type { EventStats } from '@/types';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { PageHeader } from '@/layouts/AppLayout';

interface EventOption {
  id: string;
  name: string;
}

export function AnalyticsPage() {
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState<EventStats | null>(null);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [checkinTrend, setCheckinTrend] = useState<{ time: string; count: number }[]>([]);
  const [regTrend, setRegTrend] = useState<{ time: string; count: number }[]>([]);
  const [comparison, setComparison] = useState<{ name: string; registered: number; checked_in: number }[]>([]);
  const [peakHours, setPeakHours] = useState<{ hour: string; count: number }[]>([]);
  const [eventDetail, setEventDetail] = useState<{ registered: number; checked_in: number; absent: number; attendance_rate: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, allEvents, comp, peak] = await Promise.all([
          api.getDashboardStats(),
          api.getEvents(),
          api.getEventComparison(),
          api.getPeakCheckinPeriod(),
        ]);
        setStats(s);
        setEvents(allEvents.map((e) => ({ id: e.id, name: e.name })));
        setComparison(comp);
        setPeakHours(peak);

        const paramEvent = searchParams.get('event');
        if (paramEvent && allEvents.some((e) => e.id === paramEvent)) {
          setSelectedEvent(paramEvent);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams]);

  useEffect(() => {
    if (!selectedEvent) return;
    (async () => {
      try {
        const [detail, trend, reg] = await Promise.all([
          api.getEventStats(selectedEvent),
          api.getEventCheckinTrend(selectedEvent),
          api.getRegistrationTrend(selectedEvent),
        ]);
        setEventDetail(detail);
        setCheckinTrend(trend);
        setRegTrend(reg);
      } catch {
        // ignore
      }
    })();
  }, [selectedEvent]);

  if (loading) return <LoadingState message="Loading analytics..." />;
  if (error || !stats) return <ErrorState message="Unable to load analytics data." />;

  const pieData = eventDetail
    ? [
        { name: 'Checked In', value: eventDetail.checked_in },
        { name: 'Absent', value: eventDetail.absent },
      ]
    : [
        { name: 'Checked In', value: stats.total_checkins },
        { name: 'Absent', value: Math.max(0, stats.total_attendees - stats.total_checkins) },
      ];

  const pieColors = ['#10b981', '#e2e8f0'];

  const overviewCards = [
    { label: 'Total Registered', value: stats.total_attendees, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Checked In', value: stats.total_checkins, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Total Absent', value: Math.max(0, stats.total_attendees - stats.total_checkins), icon: UserX, color: 'text-slate-600 bg-slate-100' },
    { label: 'Attendance Rate', value: `${stats.attendance_rate}%`, icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
  ];

  const hasData = stats.total_attendees > 0;

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Attendance insights across all your events" />

      {!hasData ? (
        <EmptyState
          icon={<BarChart3 className="h-7 w-7" />}
          title="No analytics yet"
          message="Once you create events and register attendees, attendance analytics will appear here."
        />
      ) : (
        <div className="space-y-6">
          {/* Overview cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {overviewCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="text-sm text-slate-500">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Event selector for detailed analytics */}
          {events.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <label className="mb-2 block text-sm font-medium text-slate-700">Event-specific analytics</label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 sm:max-w-md"
              >
                <option value="">Select an event to view details</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Charts grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Check-in trend */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-sky-600" />
                <h2 className="text-lg font-semibold text-slate-900">Check-in Trend</h2>
              </div>
              {checkinTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={checkinTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="count" name="Check-ins" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-16 text-center text-sm text-slate-400">
                  {selectedEvent ? 'No check-ins recorded for this event yet.' : 'Select an event to view check-in trends.'}
                </p>
              )}
            </div>

            {/* Registration trend */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-900">Registration Trend</h2>
              </div>
              {regTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={regTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="count" name="Registrations" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-16 text-center text-sm text-slate-400">
                  {selectedEvent ? 'No registrations recorded for this event yet.' : 'Select an event to view registration trends.'}
                </p>
              )}
            </div>

            {/* Event comparison */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-slate-900">Event Comparison</h2>
              </div>
              {comparison.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={comparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="registered" name="Registered" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="checked_in" name="Checked In" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-16 text-center text-sm text-slate-400">No events to compare.</p>
              )}
            </div>

            {/* Attendance breakdown pie */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-slate-900">
                  Attendance Breakdown
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={pieColors[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Peak check-in period */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-slate-900">Peak Check-in Period</h2>
              </div>
              {peakHours.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={peakHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Bar dataKey="count" name="Check-ins" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-16 text-center text-sm text-slate-400">No check-in data available yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
