import { useState, useRef } from 'react';
import { createOrderAttempt, readPendingOrder, submitOrderAttempt } from '../services/orders.js';
import Link from './link.jsx';
import Notice from './notice.jsx';
import { money, stockOf } from '../utils/products.js';
export default function OrderForm({
  product,
  refresh
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(() => readPendingOrder(product._id));
  const [receipt, setReceipt] = useState(null);
  const [quantity, setQuantity] = useState(attempt?.quantity ?? 1);
  const lock = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    let body = attempt;
    try {
      if (!body) body = createOrderAttempt(product._id, Object.fromEntries(new FormData(event.currentTarget)));
    } catch (e) {
      setError(e.message);
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    setAttempt(body);
    try {
      const order = await submitOrderAttempt(body);
      setReceipt(order);
      setAttempt(null);
      refresh();
    } catch (e) {
      setError(e.message);
      // Keep the immutable payload for every retry, including 429 responses.
      if (e.status === 409) refresh();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (receipt) return <section className="receipt panel" role="status">
    <span className="receipt-check">✓</span>
    <p className="eyebrow">THANK YOU</p>
    <h2>Your order is in.</h2>
    <p>Pay on delivery. Keep this reference for your records.</p>
    <dl>
      <dt>Order reference</dt>
      <dd>{receipt.id}</dd>
      <dt>Product</dt>
      <dd>{receipt.productTitle} × {receipt.quantity}</dd>
      <dt>Product total</dt>
      <dd>{money(receipt.total)}</dd>
      <dt>Payment</dt>
      <dd>Cash on delivery</dd>
      <dt>Status</dt>
      <dd>{receipt.status}</dd>
    </dl>
    <Link className="primary inline" to="/">Continue exploring ↗</Link>
  </section>;
  return <section className="panel order-panel">
    <div>
      <p className="eyebrow">ONE MORE LITTLE STEP</p>
      <h2>Make it yours.</h2>
      <p className="subtitle">Tell us where to deliver your order.</p>
      <div className="order-summary">
        <span>Product total</span>
        <strong>{money(product.price * quantity)}</strong>
        <p>Cash on delivery. Final product total is confirmed when your order is accepted.</p>
      </div>
    </div>
    <form onSubmit={submit}>{error && <Notice error>{error}</Notice>}{attempt && !busy && <Notice>We couldn’t confirm your order. Retry below with the same details to avoid a duplicate order.</Notice>}<fieldset disabled={busy || !!attempt}>
        <label>Quantity<input name="quantity" type="number" min="1" max="10000" step="1" required value={quantity} onChange={e => setQuantity(e.target.value)} />
        </label>
        <div className="editor-grid">
          <label>Full name
            <input name="customerName" defaultValue={attempt?.customerName ?? ''} autoComplete="name" maxLength="100" required />
          </label>
          <label>Phone number
            <input name="phoneNumber" defaultValue={attempt?.phoneNumber ?? ''} type="tel" autoComplete="tel" maxLength="25" required />
          </label>
        </div>
        <label>Email <small>(optional)</small>
          <input name="email" defaultValue={attempt?.email ?? ''} type="email" autoComplete="email" maxLength="254" />
        </label>
        <label>Delivery location / address<textarea name="address" defaultValue={attempt?.address ?? ''} autoComplete="street-address" placeholder="Street, ward, city and a nearby landmark" maxLength="500" required rows="3" />
        </label>
        <label>Delivery notes <small>(optional)</small>
          <textarea name="notes" defaultValue={attempt?.notes ?? ''} maxLength="1000" rows="2" placeholder="Anything else we should know?" />
        </label>
      </fieldset>
      <button className="primary" disabled={busy || !attempt && !stockOf(product)}>{busy ? 'Placing your order…' : attempt ? 'Retry this order' : 'Place order · Cash on delivery'}</button>
    </form>
  </section>;
}
