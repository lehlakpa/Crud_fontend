import { useState, useRef, useCallback } from 'react';
import { getProduct, getProducts, productFormData, saveProduct } from '../services/products.js';
import Photo from './product_photo.jsx';
import { categoryOf } from '../utils/products.js';
import Link from '../components/link.jsx';
import Notice from '../components/notice.jsx';
import ResourceState from '../components/resource_state.jsx';
import useResource from '../hooks/useResource.js';
export default function ProductEditor({
  id,
  navigate
}) {
  const loader = useCallback(async () => {
    const [products, product] = await Promise.all([getProducts(), id ? getProduct(id) : Promise.resolve(null)]);
    return {
      products,
      product
    };
  }, [id]);
  const resource = useResource(loader);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    setError('');
    let body;
    try {
      body = productFormData(event.currentTarget, !!id);
    } catch (e) {
      setError(e.message);
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      await saveProduct(id, body);
      navigate('/admin/products', 'Product saved successfully.');
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const p = resource.data?.product;
  return <>
    <Link className="back-link" to="/admin/products">← Back to inventory</Link>
    <div className="section-heading">
      <div>
        <p className="eyebrow">MAKE IT PART OF THE COLLECTION</p>
        <h1>{id ? 'Edit product.' : 'Something new.'}</h1>
        <p className="subtitle">Good details make finding the right thing a little easier.</p>
      </div>
    </div>
    <ResourceState resource={resource}>
      <form className="panel product-editor" onSubmit={submit}>{error && <Notice error>{error}</Notice>}<fieldset disabled={busy}>
          <label>Product title<input name="title" defaultValue={p?.title} required placeholder="Give your product a name" />
          </label>
          <label>Description<textarea name="description" defaultValue={p?.description} required rows="5" placeholder="What makes it special?" />
          </label>
          <div className="editor-grid">
            <label>Price (NPR)<input name="price" type="number" min="0" step="any" defaultValue={p?.price ?? ''} required placeholder="0.00" />
            </label>
            <label>Category<input name="category" list="categories" defaultValue={p ? categoryOf(p) : 'Uncategorized'} required />
              <datalist id="categories">{[...new Set((resource.data?.products || []).map(categoryOf))].map(c => <option value={c} key={c} />)}</datalist>
            </label>
            <label>Stock quantity<input name="stock" type="number" min="0" step="1" defaultValue={p?.stock ?? 0} required />
            </label>
            <label>Low-stock limit<input name="lowStockThreshold" type="number" min="0" step="1" defaultValue={p?.lowStockThreshold ?? 5} required />
            </label>
          </div>
          <div className="upload-box">{p && <Photo product={p} className="edit-image" />}<label>Product image<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required={!id} />
            </label>
            <p className="muted">JPEG, PNG or WebP · Up to 5 MB{id ? ' · Leave empty to keep the current image.' : ''}</p>
          </div>
          <div className="product-actions">
            <button className="primary inline" disabled={busy}>{busy ? 'Saving product…' : 'Save product ↗'}</button>{!busy && <Link className="secondary" to="/admin/products">Cancel</Link>}</div>
        </fieldset>
      </form>
    </ResourceState>
  </>;
}
