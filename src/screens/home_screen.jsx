import { useEffect, useRef, useState } from 'react'
import * as service from '../services/products.js'
import { sessionClient } from '../services/session.js'
import { IMAGE_ACCEPT, productId } from '../constants/products.js'

const formatPrice = (price) => Number(price).toLocaleString(undefined, { maximumFractionDigits: 20 })
const formatDate = (value) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleString() : null

export default function HomeScreen({ user, navigate }) {
  const [signingOut, setSigningOut] = useState(false)
  const [authError, setAuthError] = useState('')
  const logoutLock = useRef(false)
  async function signOut() {
    if (logoutLock.current) return
    logoutLock.current = true
    setSigningOut(true)
    setAuthError('')
    try {
      await sessionClient.logout()
      navigate('login', 'You have been signed out.')
    } catch (error) {
      setAuthError(error.message)
    } finally {
      logoutLock.current = false
      setSigningOut(false)
    }
  }
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editor, setEditor] = useState(null)
  const [selected, setSelected] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    service.getProducts(controller.signal).then((items) => {
      if (!controller.signal.aborted) setProducts(items)
    }).catch((err) => {
      if (!controller.signal.aborted) setError(err.message)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [reload])

  function refresh() {
    setLoading(true)
    setError('')
    setReload((value) => value + 1)
  }
  function edit(product = {}) {
    setError('')
    setMessage('')
    setSelected(null)
    setEditor(product)
    setPendingDelete(null)
  }
  async function run(action) {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    setMessage('')
    try { await action() } catch (err) {
      setError(err.status === 401 ? 'Your session has expired. Sign out and sign in again.' : err.message)
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    return run(async () => {
      const id = productId(editor)
      const body = service.productFormData(form, Boolean(id))
      await service.saveProduct(id, body)
      setEditor(null)
      setMessage(id ? 'Product updated.' : 'Product created.')
      refresh()
    })
  }
  function view(product) {
    return run(async () => {
      const detail = await service.getProduct(productId(product))
      setSelected(detail)
      setEditor(null)
      setPendingDelete(null)
    })
  }
  function remove() {
    return run(async () => {
      const id = productId(pendingDelete)
      await service.deleteProduct(id)
      setProducts((items) => items.filter((item) => productId(item) !== id))
      setPendingDelete(null)
      if (selected && productId(selected) === id) setSelected(null)
      if (editor && productId(editor) === id) setEditor(null)
      setMessage('Product deleted.')
    })
  }
  function askDelete(product) {
    setError('')
    setMessage('')
    setPendingDelete(product)
  }
  function cancelDelete() {
    setError('')
    setPendingDelete(null)
  }
  const disabled = busy || signingOut
  const sheet = useRef(null)
  const sheetOpen = Boolean(selected || editor || pendingDelete)
  const sheetMode = pendingDelete ? 'delete' : editor ? 'editor' : 'details'
  const editing = Boolean(productId(editor))
  function closeSheet() {
    if (disabled) return
    setSelected(null)
    setEditor(null)
    setPendingDelete(null)
    setError('')
  }
  useEffect(() => {
    if (!sheetOpen) return
    const dialog = sheet.current
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [sheetOpen])
  useEffect(() => {
    if (sheetOpen) {
      sheet.current.scrollTop = 0
      sheet.current.querySelector('.sheet-heading')?.focus()
    }
  }, [sheetOpen, sheetMode])
  return (
    <main className="catalog-shell">
      <header className="catalog-header">
        <a className="brand" href="/">CRUD<span>space</span></a>
        <div className="header-account"><span>{user.name || user.username}</span><button className="secondary" disabled={disabled} onClick={signOut}>{signingOut ? 'Signing out...' : 'Sign out'}</button></div>
      </header>
      <div className="catalog-content">
        <div className="section-heading">
          <div><h1>Products <span className="count">{products.length}</span></h1><p className="subtitle">Click a product to view details.</p></div>
          <button className="primary compact" disabled={disabled} onClick={() => edit()}>+ Add product</button>
        </div>
        {(authError || (!sheetOpen && error)) && <p className="notice error" role="alert">{authError || error}</p>}
        {message && <p className="notice success" role="status">{message}</p>}
        <dialog ref={sheet} className="product-sheet" aria-labelledby="sheet-title" onCancel={(event) => { event.preventDefault(); closeSheet() }} onClick={(event) => {
          if (event.target !== event.currentTarget) return
          const bounds = event.currentTarget.getBoundingClientRect()
          if (event.clientY < bounds.top || event.clientX < bounds.left || event.clientX > bounds.right) closeSheet()
        }}>
          <div className="sheet-heading" tabIndex={-1}>
            <h2 id="sheet-title">{pendingDelete ? 'Delete product' : editor ? (editing ? 'Edit product' : 'New product') : 'Product details'}</h2>
            <button className="secondary" type="button" disabled={disabled} onClick={closeSheet}>Close</button>
          </div>
          {error && <p className="notice error" role="alert">{error}</p>}
        {pendingDelete && (
          <section className="delete-confirm" aria-label="Confirm deletion">
            <p>Delete <strong>{pendingDelete.title}</strong>? This cannot be undone.</p>
            <div className="product-actions">
              <button className="danger" disabled={disabled} onClick={remove}>{busy ? 'Deleting...' : 'Delete product'}</button>
              <button className="secondary" disabled={disabled} onClick={cancelDelete}>Cancel</button>
            </div>
          </section>
        )}
        {editor && (
      <form key={productId(editor) ?? 'new'} onSubmit={submit} aria-busy={disabled}>
        <fieldset disabled={disabled}>
          <div className="editor-grid">
            <label htmlFor="product-title">Title<input id="product-title" name="title" defaultValue={editor.title ?? ''} required autoFocus /></label>
            <label htmlFor="product-price">Price<input id="product-price" name="price" type="number" min="0" step="any" defaultValue={editor.price ?? ''} required /></label>
          </div>
          <label htmlFor="product-description">Description<textarea id="product-description" name="description" rows="4" defaultValue={editor.description ?? ''} required /></label>
          {editing && editor.image?.url && <img className="edit-image" src={editor.image.url} alt={editor.title} />}
          <label htmlFor="product-image">{editing ? 'Replace image (optional)' : 'Product image'}
            <input id="product-image" name="image" type="file" accept={IMAGE_ACCEPT} required={!editing} />
          </label>
          {editing && <p className="field-hint">Leave the image empty to keep the current photo.</p>}
          <button className="primary" type="submit">{busy ? 'Saving...' : editing ? 'Save changes' : 'Create product'}</button>
        </fieldset>
      </form>
        )}
        {selected && !pendingDelete && (
          <section className="product-detail" aria-label="Product details">
            {selected.image?.url && <img src={selected.image.url} alt={selected.title} />}
            <div>
              <h2>{selected.title}</h2>
              <p className="product-price">Price: {formatPrice(selected.price)}</p>
              <p className="description">{selected.description}</p>
              {formatDate(selected.createdAt) && <p className="field-hint">Created: {formatDate(selected.createdAt)}</p>}
              {formatDate(selected.updatedAt) && <p className="field-hint">Updated: {formatDate(selected.updatedAt)}</p>}
              <div className="product-actions">
                <button className="secondary" disabled={disabled} onClick={() => edit(selected)}>Edit</button>
                <button className="danger" disabled={disabled} onClick={() => askDelete(selected)}>Delete</button>
              </div>
            </div>
          </section>
        )}
        </dialog>
        <div className="section-heading list-heading">
          <span className="field-hint" role="status">{busy ? 'Please wait...' : 'All products'}</span>
        </div>
        {loading ? <p className="empty-state" role="status">Loading products...</p> :
          products.length === 0 ? <div className="empty-state"><h2>{error ? 'Products unavailable' : 'No products yet'}</h2><p>{error ? 'Reload the page to try again.' : 'Add your first product to get started.'}</p></div> :
            <div className="product-grid">{products.map((product) => (
              <button className="product-card" key={productId(product)} type="button" disabled={disabled} onClick={() => view(product)} aria-label={`View details for ${product.title}`}>
                {product.image?.url ? <img src={product.image.url} alt="" loading="lazy" /> : <span className="image-placeholder">No image</span>}
                <span className="card-content">
                  <span className="card-title">{product.title}</span>
                  <span className="product-price">Price: {formatPrice(product.price)}</span>
                </span>
              </button>
            ))}</div>}
      </div>
    </main>
  )
}
