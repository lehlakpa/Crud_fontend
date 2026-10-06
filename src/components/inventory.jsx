import { useState } from 'react';
import { getProducts } from '../services/products.js';
import Link from './link.jsx';
import Photo from './product_photo.jsx';
import Status from './product_status.jsx';
import Filters from './product_filters.jsx';
import ResourceState from './resource_state.jsx';
import useResource from '../hooks/useResource.js';
import OrdersScreen from '../screens/orders_screen.jsx';
import { money, categoryOf, stockOf, isLow, filtered } from '../utils/products.js';
export default function Inventory({
  dashboard,
  lowOnly
}) {
  const resource = useResource(getProducts);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    stock: ''
  });
  const products = resource.data || [];
  const shown = filtered(lowOnly ? products.filter(isLow) : products, filters);
  return <>
    <div className="section-heading">
      <div>
        <p className="eyebrow">STORE MANAGEMENT</p>
        <h1>{dashboard ? 'Store overview' : lowOnly ? 'Stock alerts' : 'Your products'}</h1>
        <p className="subtitle">{dashboard ? 'Everything you need to keep your store in good shape.' : lowOnly ? 'Products at or below their low-stock limit, including sold-out items.' : 'Manage the details that make your store yours.'}</p>
      </div>
      <Link className="primary inline" to="/admin/products/new">+ Add product</Link>
    </div>{dashboard && <div className="stats">{[['Total products', products.length, '◇'], ['Total units', products.reduce((sum, p) => sum + stockOf(p), 0), '▦'], ['Low / out of stock', products.filter(isLow).length, '◷'], ['Categories', new Set(products.map(categoryOf)).size, '✳']].map(([label, count, icon]) => <div className="stat" key={label}>
        <span>{label}<i>{icon}</i>
        </span>
        <strong>{resource.loading || resource.error ? '—' : count}</strong>
      </div>)}</div>}<section className="panel inventory">
      <div className="section-heading">
        <h2>{dashboard ? 'Inventory at a glance' : 'Inventory'}</h2>
        <button className="secondary" onClick={resource.reload}>↻ Refresh</button>
      </div>
      <Filters admin products={products} filters={filters} setFilters={setFilters} />
      <ResourceState resource={resource} empty={!shown.length}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock / limit</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{shown.map(p => <tr key={p._id}>
                <td>
                  <Link to={`/products/${encodeURIComponent(p._id)}`} className="table-product">
                    <Photo product={p} />
                    <strong>{p.title}</strong>
                  </Link>
                </td>
                <td>{categoryOf(p)}</td>
                <td className="nowrap">{money(p.price)}</td>
                <td>{stockOf(p)} <span className="muted">/ {p.lowStockThreshold ?? 5}</span>
                </td>
                <td>
                  <Status product={p} />
                </td>
                <td>
                  <div className="table-actions">
                    <Link to={`/admin/products/${encodeURIComponent(p._id)}/edit`}>Edit</Link>
                    <Link className="text-danger" to={`/admin/products/${encodeURIComponent(p._id)}/delete`}>Delete</Link>
                  </div>
                </td>
              </tr>)}</tbody>
          </table>
        </div>
      </ResourceState>
    </section>{dashboard && <OrdersScreen />}</>;
}
