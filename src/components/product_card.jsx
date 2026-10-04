import Link from './link.jsx';
import Photo from './product_photo.jsx';
import Status from './product_status.jsx';
import { money, categoryOf } from '../utils/products.js';
export default function ProductCard({
  product
}) {
  return <Link to={`/products/${encodeURIComponent(product._id)}`} className="product-card">
    <div className="card-image">
      <Photo product={product} />
      <Status product={product} />
    </div>
    <div className="card-content">
      <p className="eyebrow">{categoryOf(product)}</p>
      <h3>{product.title}</h3>
      <p className="card-description">{product.description}</p>
      <div className="card-bottom">
        <strong>{money(product.price)}</strong>
        <span className="round-arrow" aria-label="View details">↗</span>
      </div>
    </div>
  </Link>;
}
