export const money = value => new Intl.NumberFormat('en-NP', {
  style: 'currency',
  currency: 'NPR',
  maximumFractionDigits: 2
}).format(value ?? 0);
export const categoryOf = p => p.category || 'Uncategorized';
export const stockOf = p => p.stock ?? 0;
export const isLow = p => stockOf(p) <= (p.lowStockThreshold ?? 5);
export const availability = p => stockOf(p) === 0 ? 'Out of stock' : isLow(p) ? 'Low stock' : 'In stock';
export function filtered(products, filters) {
  return products.filter(p => (!filters.category || categoryOf(p) === filters.category) && (!filters.stock || availability(p) === filters.stock) && `${p.title} ${p.description}`.toLowerCase().includes(filters.search.toLowerCase()));
}
