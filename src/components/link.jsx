export default function Link({
  to,
  children,
  className = '',
  ...props
}) {
  return <a href={to} className={className} {...props} onClick={event => {
    if (props['aria-disabled']) {
      event.preventDefault();
      return;
    }
    if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.pushState({}, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }}>{children}</a>;
}
