import { useCallback } from 'react';
import { getProduct } from '../services/products.js';
import useResource from '../hooks/useResource.js';
import ResourceState from './resource_state.jsx';
import Link from './link.jsx';
import Photo from './product_photo.jsx';
import Status from './product_status.jsx';
import OrderForm from './order_form.jsx';
import { categoryOf, money, stockOf } from '../utils/products.js';
export default function ProductPage({
  id,
  order,
  navigate
}) {
  const loader = useCallback(() => getProduct(id), [id]);
  const resource = useResource(loader);
  const product = resource.data;
  return <section className="page">
    <Link to="/" className="back-link">← Back to collection</Link>
    <ResourceState resource={resource}>{product && <>
        <div className="detail-grid">
          <div className="detail-image">
            <Photo product={product} />
          </div>
          <div className="detail-copy">
            <p className="eyebrow">{categoryOf(product)}</p>
            <h1>{product.title}</h1>
            <Status product={product} />
            <p className="detail-price">{money(product.price)}</p>
            <p className="description">{product.description}</p>
            <p className="muted">{stockOf(product)} units available</p>{!order && <Link className={`primary inline ${!stockOf(product) ? 'disabled-link' : ''}`} to={`/products/${encodeURIComponent(id)}/order`} aria-disabled={!stockOf(product)} onKeyDown={e => {
              if (!stockOf(product)) e.preventDefault();
            }}>Order now <span>↗</span>
            </Link>}<p className="delivery-note">✓ Cash on delivery · No account required</p>
          </div>
        </div>{order && <OrderForm product={product} refresh={resource.reload} navigate={navigate} />}</>}</ResourceState>
  </section>;
}
