import ProductEditor from '../components/product_editor.jsx';
export default function EditProductScreen({
  id,
  navigate
}) {
  return <ProductEditor id={id} navigate={navigate} />;
}
