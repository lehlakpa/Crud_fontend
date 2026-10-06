import { useRef, useState } from 'react';
import { ORDER_STATUSES, updateOrderStatus } from '../services/orders.js';
import Notice from './notice.jsx';

export default function OrderStatusEditor({ order, onSaved }) {
  const [savedStatus, setSavedStatus] = useState(order.status || '');
  const [status, setStatus] = useState(order.status || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const lock = useRef(false);

  async function save(event) {
    event.preventDefault();
    if (lock.current || status === savedStatus) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await updateOrderStatus(order._id, status);
      setSavedStatus(status);
      setMessage('Status updated.');
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return <form onSubmit={save}>
    <span className="badge low">{savedStatus || 'Unknown'}</span>
    <label>Status
      <select aria-label={`Status for order ${order._id}`} value={status} disabled={busy} onChange={event => {
        setStatus(event.target.value);
        setError('');
        setMessage('');
      }}>
        {!ORDER_STATUSES.includes(savedStatus) && <option value={savedStatus} disabled>{savedStatus || 'Choose status'}</option>}
        {ORDER_STATUSES.map(value => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}
      </select>
    </label>
    <button className="secondary" disabled={busy || status === savedStatus || !ORDER_STATUSES.includes(status)}>{busy ? 'Saving...' : 'Save status'}</button>
    {error && <Notice error>{error}</Notice>}
    {message && <Notice>{message}</Notice>}
  </form>;
}
