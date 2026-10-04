import { stockOf, isLow, availability } from '../utils/products.js';
export default function Status({
  product
}) {
  return <span className={`badge ${stockOf(product) === 0 ? 'out' : isLow(product) ? 'low' : 'in'}`}>
    <span />{availability(product)}</span>;
}
