import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '@/components/Toast';
import { AppLayout } from '@/layouts/AppLayout';
import { LandingPage } from '@/pages/LandingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EventsPage } from '@/pages/EventsPage';
import { EventFormPage } from '@/pages/EventFormPage';
import { EventDetailsPage } from '@/pages/EventDetailsPage';
import { RegistrationPage } from '@/pages/RegistrationPage';
import { AttendeesPage } from '@/pages/AttendeesPage';
import { ScannerPage } from '@/pages/ScannerPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { SettingsPage } from '@/pages/SettingsPage';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="*"
            element={
              <AppLayout>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/events/new" element={<EventFormPage />} />
                  <Route path="/events/:id/edit" element={<EventFormPage />} />
                  <Route path="/events/:id" element={<EventDetailsPage />} />
                  <Route path="/events/:id/register" element={<RegistrationPage />} />
                  <Route path="/events/:id/attendees" element={<AttendeesPage />} />
                  <Route path="/scanner" element={<ScannerPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </AppLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
