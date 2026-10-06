import { useState } from 'react';
import { getProducts } from '../services/products.js';
import useResource from '../hooks/useResource.js';
import ResourceState from '../components/resource_state.jsx';
import Filters from '../components/product_filters.jsx';
import ProductCard from '../components/product_card.jsx';
import { filtered } from '../utils/products.js';
import Link from '../components/link.jsx';
import Photo from '../components/product_photo.jsx';
import { money, categoryOf } from '../utils/products.js';
export default function HomeScreen() {
  const resource = useResource(getProducts);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    stock: ''
  });
  const products = resource.data || [];
  const shown = filtered(products, filters);
  const featured = products[0];
  return <>
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">A FRESH TAKE ON EVERYDAY</p>
        <h1>Your everyday.<br />
          <em>Made better.</em>
        </h1>
        <p>Find something you’ll love, for the moments that make every day yours.</p>
        <a href="#collection" className="primary inline">Explore the collection <span>↗</span>
        </a>
        <div className="hero-note">
          <span>↗</span> Thoughtful finds. Simple shopping.</div>
      </div>
      <div className="hero-showcase">
        <div className="showcase-heading"><span>THE EVERYDAY EDIT</span><span aria-hidden="true">↗</span></div>
        {featured ? <Link className="featured-product" to={`/products/${encodeURIComponent(featured._id)}`}>
          <div className="featured-image"><Photo product={featured} /></div>
          <div className="featured-caption"><div><p className="eyebrow">{categoryOf(featured)}</p><h2>{featured.title}</h2></div><strong>{money(featured.price)}</strong></div>
        </Link> : <div className="showcase-placeholder"><span aria-hidden="true">e.</span><p>Good things for<br />your everyday.</p></div>}
        <div className="showcase-footer"><span>Discover something you love</span><span aria-hidden="true">01 / EVERYDAY</span></div>
      </div>
    </section>
    <div className="benefits">
      <span>↗ &nbsp; Discover your everyday favorites</span>
      <span>◇ &nbsp; No account needed</span>
      <span>✓ &nbsp; Cash on delivery</span>
    </div>
    <section id="collection" className="collection">
      <div className="section-heading">
        <div>
          <p className="eyebrow">CURATED FOR YOUR EVERYDAY</p>
          <h2>Explore the collection</h2>
        </div>
        <span className="muted">{products.length} products</span>
      </div>
      <Filters products={products} filters={filters} setFilters={setFilters} />
      <ResourceState resource={resource} empty={!shown.length}>
        <div className="product-grid">{shown.map(product => <ProductCard product={product} key={product._id} />)}</div>
      </ResourceState>
    </section>
  </>;
}
