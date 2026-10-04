import { useState } from 'react';
import { getProducts } from '../services/products.js';
import useResource from '../hooks/useResource.js';
import ResourceState from '../components/resource_state.jsx';
import Filters from '../components/product_filters.jsx';
import ProductCard from '../components/product_card.jsx';
import { filtered } from '../utils/products.js';
export default function HomeScreen() {
  const resource = useResource(getProducts);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    stock: ''
  });
  const products = resource.data || [];
  const shown = filtered(products, filters);
  return <>
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">THE EVERYDAY COLLECTION</p>
        <h1>Little things.<br />
          <em>Lovely living.</em>
        </h1>
        <p>Find something you’ll love, for the moments that make every day yours.</p>
        <a href="#collection" className="primary inline">Explore the collection <span>↗</span>
        </a>
        <div className="hero-note">
          <span>↗</span> Thoughtful finds. Simple shopping.</div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="art-circle" />
        <div className="vase">
          <i />
          <i />
          <i />
        </div>
        <div className="art-cup" />
        <div className="art-book" />
        <span className="art-caption">A little more everyday joy.</span>
        <span className="art-spark">✳</span>
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
