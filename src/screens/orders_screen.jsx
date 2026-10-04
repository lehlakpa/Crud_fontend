import { useState, useCallback } from 'react';
import { sessionClient } from '../services/session.js';
import ResourceState from '../components/resource_state.jsx';
import useResource from '../hooks/useResource.js';
import { money } from '../utils/products.js';
export default function OrdersScreen() {
  const [page, setPage] = useState(1);
  const loader = useCallback(() => sessionClient.authorizedRequest(`/api/orders?${new URLSearchParams({
    page
  })}`), [page]);
  const resource = useResource(loader);
  return <section className="panel">
    <div className="section-heading">
      <div>
        <p className="eyebrow">FRESH FROM YOUR CUSTOMERS</p>
        <h2>Incoming orders</h2>
      </div>
      <button className="secondary" onClick={resource.reload}>↻ Refresh</button>
    </div>
    <ResourceState resource={resource} empty={!resource.data?.orders?.length}>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order / date</th>
              <th>Customer & delivery</th>
              <th>Product</th>
              <th>Total</th>
              <th>Status / payment</th>
            </tr>
          </thead>
          <tbody>{resource.data?.orders?.map(o => <tr key={o._id}>
              <td>
                <small>{o._id}</small>
                <p className="muted">{o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</p>
              </td>
              <td className="order-contact">
                <strong>{o.customerName || 'Customer'}</strong>
                <p>{o.phoneNumber}</p>
                <p>{o.email}</p>
                <p>{o.address}</p>{o.notes && <p className="muted">Note: {o.notes}</p>}</td>
              <td>{o.productTitle || o.productSnapshot?.title || o.product?.title || 'Product'}<p className="muted">{o.quantity} × {money(o.unitPrice)}</p>
              </td>
              <td className="nowrap">{money(o.total)}</td>
              <td>
                <span className="badge low">{o.status}</span>
                <p className="muted">Cash on delivery</p>
              </td>
            </tr>)}</tbody>
        </table>
      </div>
    </ResourceState>
    <div className="pagination">
      <button className="secondary" disabled={page === 1 || resource.loading} onClick={() => setPage(p => p - 1)}>← Previous</button>
      <span>Page {page}</span>
      <button className="secondary" disabled={!resource.data?.hasMore || resource.loading || !!resource.error} onClick={() => setPage(p => p + 1)}>Next →</button>
    </div>
  </section>;
}
