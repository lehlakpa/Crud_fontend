import { useCallback, useRef, useState } from 'react';
import { deleteProduct, getProduct } from '../services/products.js';
import useResource from '../hooks/useResource.js';
import Link from '../components/link.jsx';
import Notice from '../components/notice.jsx';
import Photo from '../components/product_photo.jsx';
import ResourceState from '../components/resource_state.jsx';
export default function DeleteProductScreen({
  id,
  navigate
}) {
  const loader = useCallback(() => getProduct(id), [id]);
  const resource = useResource(loader);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  async function remove(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await deleteProduct(id);
      navigate('/admin/products', 'Product deleted successfully.');
    } catch (error) {
      setError(error.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return <section>
    {!busy && <Link className="back-link" to="/admin/products">← Back to products</Link>}
    <div className="section-heading">
      <div>
        <p className="eyebrow">PRODUCT MANAGEMENT</p>
        <h1>Delete product</h1>
      </div>
    </div>
    <ResourceState resource={resource}>
      {resource.data && <form className="panel delete-confirm" onSubmit={remove} aria-busy={busy}>
        <Photo product={resource.data} className="edit-image" />
        <h2>Delete “{resource.data.title}”?</h2>
        <p>This removes the product from your store. This action cannot be undone.</p>
        {error && <Notice error>{error}</Notice>}
        <div className="product-actions">
          <button className="danger" type="submit" disabled={busy}>
            {busy ? 'Deleting…' : 'Delete product'}
          </button>
          {!busy && <Link className="secondary" to="/admin/products">Keep product</Link>}
        </div>
      </form>}
    </ResourceState>
  </section>;
}
