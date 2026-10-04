import { categoryOf } from '../utils/products.js';
export default function Filters({
  products,
  filters,
  setFilters,
  admin
}) {
  const categories = [...new Set(products.map(categoryOf))].sort();
  return <div className="filters">
    <label className="search">
      <span aria-hidden="true">⌕</span>
      <input aria-label="Search products" placeholder="Search for something lovely…" value={filters.search} onChange={e => setFilters({
        ...filters,
        search: e.target.value
      })} />
    </label>
    <select aria-label="Category" value={filters.category} onChange={e => setFilters({
      ...filters,
      category: e.target.value
    })}>
      <option value="">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select>{admin && <select aria-label="Stock status" value={filters.stock} onChange={e => setFilters({
      ...filters,
      stock: e.target.value
    })}>
      <option value="">All stock levels</option>
      <option>In stock</option>
      <option>Low stock</option>
      <option>Out of stock</option>
    </select>}</div>;
}
