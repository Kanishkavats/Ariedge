/**
 * Inline alert banner for error / success / info feedback.
 */
export default function Alert({ type = 'error', message }) {
  if (!message) return null;

  const styles = {
    error:   'alert-error',
    success: 'alert-success',
    info:    'alert-info',
  };

  const icons = {
    error: (
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
      </svg>
    ),
    success: (
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    info: (
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>
      </svg>
    ),
  };

  return (
    <div className={styles[type]}>
      {icons[type]}
      <span>{message}</span>
    </div>
  );
}
