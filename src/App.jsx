import { Fragment } from 'react'
import HomeScreen from './screens/home_screen.jsx'
import LoginScreen from './screens/login_screen.jsx'
import RegisterScreen from './screens/register_screen.jsx'
import DashboardScreen from './screens/dashboard_screen.jsx'
import ProductsScreen from './screens/products_screen.jsx'
import LowStockScreen from './screens/low_stock_screen.jsx'
import ProductDetailsScreen from './screens/product_details_screen.jsx'
import AddProductScreen from './screens/add_product_screen.jsx'
import EditProductScreen from './screens/edit_product_screen.jsx'
import DeleteProductScreen from './screens/delete_product_screen.jsx'
import OrderScreen from './screens/order_screen.jsx'
import OrdersScreen from './screens/orders_screen.jsx'
import NotFoundScreen from './screens/not_found_screen.jsx'
import AdminGate from './components/admin_gate.jsx'
import Notice from './components/notice.jsx'
import AdminLayout from './layouts/admin_layout.jsx'
import AuthLayout from './layouts/auth_layout.jsx'
import SiteLayout from './layouts/site_layout.jsx'
import useNavigation from './hooks/useNavigation.js'
import './App.css'
import './modern.css'

export default function App() {
  const { path, message, navigate } = useNavigation()
  const auth = path === '/admin/login'
  const admin = path === '/admin' || (path.startsWith('/admin/') && !auth)
  const productMatch = path.match(/^\/products\/([^/]+)(\/order)?$/)
  const editMatch = path.match(/^\/admin\/products\/([^/]+)\/edit$/)
  const deleteMatch = path.match(/^\/admin\/products\/([^/]+)\/delete$/)
  let screen = <NotFoundScreen />

  if (path === '/') screen = <HomeScreen />
  else if (path === '/admin/login') screen = <LoginScreen navigate={navigate} message={message} />
  else if (path === '/admin/register') screen = <RegisterScreen navigate={navigate} />
  else if (path === '/admin') screen = <DashboardScreen />
  else if (path === '/admin/products') screen = <ProductsScreen />
  else if (path === '/admin/low-stock') screen = <LowStockScreen />
  else if (path === '/admin/orders') screen = <OrdersScreen />
  else if (path === '/admin/products/new') screen = <AddProductScreen navigate={navigate} />
  else if (editMatch) screen = <EditProductScreen id={editMatch[1]} navigate={navigate} />
  else if (deleteMatch) screen = <DeleteProductScreen id={deleteMatch[1]} navigate={navigate} />
  else if (productMatch) screen = productMatch[2]
    ? <OrderScreen id={productMatch[1]} />
    : <ProductDetailsScreen id={productMatch[1]} />

  // Reset screen state when navigating between products or admin pages.
  const page = <Fragment key={path}>{screen}</Fragment>
  let content = <main>{page}</main>
  if (auth) content = <AuthLayout>{page}</AuthLayout>
  else if (admin) content = (
    <AdminGate navigate={navigate}>
      <AdminLayout path={path} navigate={navigate}>
        {message && <Notice>{message}</Notice>}
        {page}
      </AdminLayout>
    </AdminGate>
  )

  return <SiteLayout admin={admin} auth={auth}>{content}</SiteLayout>
}
