export default function Notice({
  error,
  children
}) {
  return <p className={`notice ${error ? 'error' : 'success'}`} role={error ? 'alert' : 'status'}>{children}</p>;
}
