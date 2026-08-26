import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Camera,
  CameraOff,
  RefreshCw,
  CalendarDays,
  ChevronDown,
  Upload,
} from 'lucide-react';

import { api } from '@/services/api';
import type { Event, CheckInResult } from '@/types';
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/States';
import { PageHeader } from '@/layouts/AppLayout';
import { useToast } from '@/components/Toast';

export function ScannerPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] =
    useState<string>('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [result, setResult] =
    useState<CheckInResult | null>(null);

  const [resultKey, setResultKey] = useState(0);

  const [cameraError, setCameraError] =
    useState(false);

  const scannerRef =
    useRef<Html5Qrcode | null>(null);

  const uploadScannerRef =
    useRef<Html5Qrcode | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const processingRef = useRef(false);

  const containerId = 'qr-reader';
  const uploadContainerId = 'qr-upload-reader';

  const { notify } = useToast();
  const [searchParams] = useSearchParams();

  /* =========================================================
     LOAD EVENTS
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadEvents = async () => {
      try {
        const data = await api.getEvents();

        if (!mounted) return;

        setEvents(data);

        const paramEvent =
          searchParams.get('event');

        if (
          paramEvent &&
          data.some((e) => e.id === paramEvent)
        ) {
          setSelectedEventId(paramEvent);
        } else if (data.length > 0) {
          setSelectedEventId(data[0].id);
        }
      } catch (err) {
        console.error(
          'Unable to load events:',
          err
        );

        if (mounted) {
          setError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      mounted = false;
    };
  }, [searchParams]);

  const selectedEvent = events.find(
    (e) => e.id === selectedEventId
  );

  /* =========================================================
     EXTRACT TOKEN FROM QR
  ========================================================= */

  const extractQRToken = (
    qrValue: string
  ): string => {
    const value = qrValue.trim();

    if (!value) {
      return '';
    }

    /*
     * RegistrationPage creates:
     *
     * {
     *   type: "attendee",
     *   token: "xxxxxxxx",
     *   eventId: "xxxxxxxx"
     * }
     */

    try {
      const parsed = JSON.parse(value);

      if (
        parsed &&
        typeof parsed === 'object' &&
        typeof parsed.token === 'string'
      ) {
        return parsed.token.trim();
      }
    } catch {
      // Not JSON.
    }

    /*
     * Also support a possible JSON string
     * returned by a scanner.
     */

    try {
      const decoded = decodeURIComponent(value);

      const parsed = JSON.parse(decoded);

      if (
        parsed &&
        typeof parsed === 'object' &&
        typeof parsed.token === 'string'
      ) {
        return parsed.token.trim();
      }
    } catch {
      // Not encoded JSON.
    }

    /*
     * Raw token QR.
     */

    return value;
  };

  /* =========================================================
     PROCESS CHECK-IN
  ========================================================= */

  const processCheckIn = async (
    decodedText: string
  ) => {
    if (processingRef.current) {
      return;
    }

    if (!selectedEventId) {
      notify(
        'Please select an event first.',
        'error'
      );
      return;
    }

    processingRef.current = true;

    /*
     * IMPORTANT:
     * Always stop/pause camera while processing.
     */

    if (scannerRef.current) {
      try {
        await scannerRef.current.pause(true);
      } catch {
        // Ignore
      }
    }

    try {
      console.log(
        '=============================='
      );

      console.log(
        'RAW QR VALUE:',
        decodedText
      );

      const qrToken =
        extractQRToken(decodedText);

      console.log(
        'EXTRACTED QR TOKEN:',
        qrToken
      );

      console.log(
        'SELECTED EVENT ID:',
        selectedEventId
      );

      console.log(
        '=============================='
      );

      if (!qrToken) {
        const invalidResult: CheckInResult = {
          success: false,
          message: 'Invalid QR code.',
        };

        setResult(invalidResult);
        setResultKey((k) => k + 1);

        notify(
          'Invalid QR code.',
          'error'
        );

        return;
      }

      /*
       * Send token to API.
       *
       * api.ts also supports JSON,
       * but here we send the clean token.
       */

      const checkInResult =
        await api.checkIn(
          qrToken,
          selectedEventId
        );

      setResult(checkInResult);
      setResultKey((k) => k + 1);

      /* SUCCESS */

      if (checkInResult.success) {
        notify(
          `${
            checkInResult.attendee?.name ??
            'Attendee'
          } checked in successfully!`,
          'success'
        );

        return;
      }

      /* ALREADY CHECKED IN */

      if (
        checkInResult.already_checked_in
      ) {
        notify(
          `${
            checkInResult.attendee?.name ??
            'Attendee'
          } was already checked in.`,
          'info'
        );

        return;
      }

      /* OTHER ERROR */

      notify(
        checkInResult.message,
        'error'
      );
    } catch (err) {
      console.error(
        'Check-in error:',
        err
      );

      const failedResult: CheckInResult = {
        success: false,
        message:
          'Check-in failed. Please try again.',
      };

      setResult(failedResult);
      setResultKey((k) => k + 1);

      notify(
        'Check-in failed. Please try again.',
        'error'
      );
    } finally {
      processingRef.current = false;

      /*
       * Resume camera after processing.
       */

      setTimeout(() => {
        if (scannerRef.current) {
          try {
            scannerRef.current.resume();
          } catch {
            // Ignore
          }
        }
      }, 2500);
    }
  };

  /* =========================================================
     START CAMERA
  ========================================================= */

  const startScan = () => {
    if (!selectedEventId) {
      notify(
        'Please select an event first.',
        'error'
      );
      return;
    }

    setCameraError(false);
    setResult(null);
    setScanning(true);
  };

  /* =========================================================
     INITIALIZE CAMERA
  ========================================================= */

  useEffect(() => {
    if (!scanning) {
      return;
    }

    let mounted = true;

    const initCamera = async () => {
      try {
        /*
         * Prevent duplicate scanner instances.
         */

        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
          } catch {
            // Ignore
          }

          try {
            await scannerRef.current.clear();
          } catch {
            // Ignore
          }

          scannerRef.current = null;
        }

        const scanner =
          new Html5Qrcode(
            containerId,
            {
              verbose: false,
            }
          );

        scannerRef.current = scanner;

        await scanner.start(
          {
            facingMode: 'environment',
          },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
          },
          async (
            decodedText: string
          ) => {
            if (
              mounted &&
              !processingRef.current
            ) {
              await processCheckIn(
                decodedText
              );
            }
          },
          () => {
            /*
             * Ignore scan failures.
             */
          }
        );
      } catch (err) {
        console.error(
          'Camera error:',
          err
        );

        if (mounted) {
          setCameraError(true);
          setScanning(false);

          notify(
            'Unable to access camera. Please grant camera permission and try again.',
            'error'
          );
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
    };
  }, [scanning]);

  /* =========================================================
     STOP CAMERA
  ========================================================= */

  const stopScan = async () => {
    processingRef.current = false;

    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Ignore
      }

      try {
        await scannerRef.current.clear();
      } catch {
        // Ignore
      }

      scannerRef.current = null;
    }

    setScanning(false);
  };

  /* =========================================================
     UPLOAD QR IMAGE
  ========================================================= */

  const handleQRUpload = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    /*
     * Allow selecting same file again.
     */

    e.target.value = '';

    if (!file) {
      return;
    }

    if (!selectedEventId) {
      notify(
        'Please select an event first.',
        'error'
      );
      return;
    }

    if (scanning) {
      notify(
        'Please stop camera scanning before uploading a QR image.',
        'info'
      );
      return;
    }

    if (uploading) {
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      /*
       * Create hidden scanner for image.
       */

      const uploadScanner =
        new Html5Qrcode(
          uploadContainerId,
          {
            verbose: false,
          }
        );

      uploadScannerRef.current =
        uploadScanner;

      console.log(
        'Reading uploaded QR image...'
      );

      /*
       * Decode image.
       */

      const decodedText =
        await uploadScanner.scanFile(
          file,
          true
        );

      console.log(
        'UPLOADED QR DECODED:',
        decodedText
      );

      /*
       * Now perform REAL CHECK-IN.
       *
       * IMPORTANT:
       * Do NOT display "successfully scanned"
       * until QR decoding + check-in both happen.
       */

      await processCheckIn(
        decodedText
      );

      /*
       * We only reach here if decoding itself
       * succeeded. The actual check-in result
       * is already displayed by processCheckIn().
       */

      console.log(
        'QR image decoded successfully.'
      );
    } catch (err) {
      console.error(
        'QR upload error:',
        err
      );

      const failedResult: CheckInResult = {
        success: false,
        message:
          'Unable to read a QR code from this image.',
      };

      setResult(failedResult);
      setResultKey((k) => k + 1);

      notify(
        'Could not detect a QR code in the selected image.',
        'error'
      );
    } finally {
      if (uploadScannerRef.current) {
        try {
          await uploadScannerRef.current.clear();
        } catch {
          // Ignore
        }

        uploadScannerRef.current = null;
      }

      setUploading(false);
    }
  };

  /* =========================================================
     PAGE CLEANUP
  ========================================================= */

  useEffect(() => {
    return () => {
      processingRef.current = false;

      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            return scannerRef.current?.clear();
          })
          .catch(() => {});
      }

      if (uploadScannerRef.current) {
        uploadScannerRef.current
          .clear()
          .catch(() => {});
      }
    };
  }, []);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <LoadingState
        message="Loading scanner..."
      />
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <ErrorState
        message="Unable to load events for scanning."
      />
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div>
      <PageHeader
        title="QR Scanner"
        subtitle="Scan attendee QR codes to check them in"
      />

      {events.length === 0 ? (
        <EmptyState
          icon={
            <CalendarDays className="h-7 w-7" />
          }
          title="No events available"
          message="Create an event before scanning QR codes."
          action={
            <Link
              to="/events/new"
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Create Event
            </Link>
          }
        />
      ) : (
        <div className="mx-auto max-w-2xl space-y-6">

          {/* =================================================
              EVENT SELECTOR
          ================================================= */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Select Event
            </label>

            <div className="relative">
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(
                    e.target.value
                  );

                  setResult(null);
                }}
                disabled={
                  scanning || uploading
                }
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:opacity-60"
              >
                {events.map((event) => (
                  <option
                    key={event.id}
                    value={event.id}
                  >
                    {event.name} —{' '}
                    {new Date(
                      event.date +
                        'T00:00:00'
                    ).toLocaleDateString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    )}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {selectedEvent && (
              <p className="mt-2 text-xs text-slate-500">
                {selectedEvent.venue} ·{' '}
                {selectedEvent.start_time}–
                {selectedEvent.end_time}
              </p>
            )}
          </div>

          {/* =================================================
              SCANNER CARD
          ================================================= */}

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

            {/* Hidden QR upload decoder */}

            <div
              id={uploadContainerId}
              className="hidden"
            />

            {/* =================================================
                READY
            ================================================= */}

            {!scanning &&
              !cameraError && (
                <div className="flex flex-col items-center gap-4 py-8">

                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                    <Camera className="h-10 w-10" />
                  </div>

                  <div className="text-center">
                    <p className="text-base font-medium text-slate-700">
                      Ready to scan
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {selectedEvent
                        ? `Scanning for: ${selectedEvent.name}`
                        : 'Select an event first'}
                    </p>
                  </div>

                  {/* CAMERA */}

                  <button
                    onClick={
                      startScan
                    }
                    disabled={
                      !selectedEventId ||
                      uploading
                    }
                    className="flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    <ScanLine className="h-5 w-5" />
                    Start Scanning
                  </button>

                  {/* FILE INPUT */}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    onChange={
                      handleQRUpload
                    }
                    className="hidden"
                  />

                  {/* UPLOAD */}

                  <button
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={
                      !selectedEventId ||
                      uploading
                    }
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        Reading QR...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        Upload QR Image
                      </>
                    )}
                  </button>

                  <p className="max-w-sm text-center text-xs text-slate-400">
                    Scan the attendee QR using
                    your camera, or upload the QR
                    image downloaded after
                    registration.
                  </p>
                </div>
              )}

            {/* =================================================
                CAMERA ERROR
            ================================================= */}

            {cameraError && (
              <div className="flex flex-col items-center gap-4 py-8 text-center">

                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <CameraOff className="h-10 w-10" />
                </div>

                <div>
                  <p className="text-base font-medium text-slate-700">
                    Camera access denied
                  </p>

                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Please allow camera
                    access in your browser
                    settings and try again.
                  </p>
                </div>

                <button
                  onClick={
                    startScan
                  }
                  className="flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={
                    handleQRUpload
                  }
                  className="hidden"
                />

                <button
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  disabled={
                    uploading
                  }
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  Upload QR Image
                </button>
              </div>
            )}

            {/* =================================================
                CAMERA SCANNING
            ================================================= */}

            {scanning && (
              <div className="space-y-4">

                <div
                  id={containerId}
                  className="mx-auto overflow-hidden rounded-xl border-2 border-sky-200 bg-slate-900"
                  style={{
                    maxWidth: '100%',
                  }}
                />

                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />

                  Scanning... point camera
                  at an attendee QR code
                </div>

                <button
                  onClick={
                    stopScan
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <CameraOff className="h-4 w-4" />
                  Stop Scanning
                </button>
              </div>
            )}
          </div>

          {/* =================================================
              RESULT
          ================================================= */}

          {result && (
            <div
              key={resultKey}
              className={`rounded-2xl border-2 p-6 shadow-sm animate-scale-in ${
                result.success
                  ? 'border-emerald-200 bg-emerald-50'
                  : result.already_checked_in
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-rose-200 bg-rose-50'
              }`}
            >
              <div className="flex items-start gap-4">

                {/* ICON */}

                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                    result.success
                      ? 'bg-emerald-100 text-emerald-600'
                      : result.already_checked_in
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : result.already_checked_in ? (
                    <AlertCircle className="h-6 w-6" />
                  ) : (
                    <XCircle className="h-6 w-6" />
                  )}
                </div>

                {/* CONTENT */}

                <div className="flex-1">

                  <h3
                    className={`text-lg font-bold ${
                      result.success
                        ? 'text-emerald-900'
                        : result.already_checked_in
                          ? 'text-amber-900'
                          : 'text-rose-900'
                    }`}
                  >
                    {result.message}
                  </h3>

                  {result.success && (
                    <p className="mt-1 text-sm font-medium text-emerald-700">
                      ✓ Attendance recorded successfully
                    </p>
                  )}

                  {result.attendee && (
                    <div className="mt-3 space-y-1 text-sm">

                      <p className="text-slate-700">
                        <span className="font-medium">
                          Attendee:
                        </span>{' '}
                        {result.attendee.name}
                      </p>

                      <p className="text-slate-600">
                        {result.attendee.email}
                      </p>

                      {result.event_name && (
                        <p className="text-slate-600">
                          <span className="font-medium">
                            Event:
                          </span>{' '}
                          {result.event_name}
                        </p>
                      )}

                      {result.checked_in_at && (
                        <p className="text-slate-600">
                          <span className="font-medium">
                            Time:
                          </span>{' '}
                          {new Date(
                            result.checked_in_at
                          ).toLocaleString(
                            'en-US',
                            {
                              dateStyle:
                                'medium',
                              timeStyle:
                                'short',
                            }
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  {/* SUCCESS ACTION */}

                  {result.success && (
                    <div className="mt-4 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">
                      ✓ Check-in completed
                    </div>
                  )}

                  {/* ALREADY CHECKED IN */}

                  {result.already_checked_in && (
                    <div className="mt-4 rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800">
                      This attendee has already
                      been checked in.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}