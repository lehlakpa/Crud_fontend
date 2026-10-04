export default function Photo({
  product,
  className = ''
}) {
  return product.image?.url ? <img className={className} src={product.image.url} alt={product.title} loading="lazy" /> : <div className={`image-placeholder ${className}`}>
    <span>◇</span>Image unavailable</div>;
}
