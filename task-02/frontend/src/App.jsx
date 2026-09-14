import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import './index.css';
import './payment.css';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:3001/api' 
  : 'https://task2-zeta-dusky.vercel.app/api';

const Toast = ({ message, type }) => (
  <div className={`toast ${type}`}>
    {message}
  </div>
);

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category !== 'All') params.append('category', category);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const res = await axios.get(`${API_BASE}/products?${params.toString()}`);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, [search, category, minPrice, maxPrice]);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        showNotification('Cannot exceed available stock!', 'error');
        return;
      }
      setCart(cart.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      if (product.stock < 1) {
        showNotification('Item is out of stock!', 'error');
        return;
      }
      setCart([...cart, { product_id: product.id, name: product.name, price: product.price, quantity: 1 }]);
    }
    showNotification(`${product.name} added to cart`);
  };

  const updateQuantity = (productId, delta) => {
    const product = products.find(p => p.id === productId);
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQ = item.quantity + delta;
        if (newQ > product.stock) {
          showNotification('Not enough stock available', 'error');
          return item;
        }
        return { ...item, quantity: newQ };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Router>
      <div className="layout">
        {toast && <Toast message={toast.message} type={toast.type} />}
        
        <nav className="navbar">
          <div className="navbar-container">
            <h1 className="logo">TechLoom E-Commerce</h1>
            <div className="nav-links">
              <Link to="/">Shop</Link>
              <Link to="/orders">Order History</Link>
              <Link to="/cart" className="cart-link">
                Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <StorePage 
                products={products} 
                addToCart={addToCart} 
                search={search} setSearch={setSearch}
                category={category} setCategory={setCategory}
                minPrice={minPrice} setMinPrice={setMinPrice}
                maxPrice={maxPrice} setMaxPrice={setMaxPrice}
              />
            } />
            <Route path="/cart" element={
              <CartPage 
                cart={cart} 
                updateQuantity={updateQuantity} 
                cartTotal={cartTotal} 
              />
            } />
            <Route path="/payment" element={
              <PaymentPage 
                cart={cart} 
                clearCart={() => setCart([])} 
                fetchProducts={fetchProducts}
                showNotification={showNotification}
              />
            } />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/orders" element={<OrderHistoryPage showNotification={showNotification} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// 1. Store Page with Discovery (Search, Filters, Product Details)
function StorePage({ products, addToCart, search, setSearch, category, setCategory, minPrice, setMinPrice, maxPrice, setMaxPrice }) {
  const [selectedProduct, setSelectedProduct] = useState(null);

  const categories = ['All', 'Accessories', 'Peripherals', 'Displays', 'Audio'];

  return (
    <div>
      <div className="discovery-bar glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Search products..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ flex: 1, minWidth: '200px' }}
        />
        <select 
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
          className="form-input"
          style={{ width: 'auto' }}
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input 
          type="number" 
          placeholder="Min Price (LKR)" 
          value={minPrice} 
          onChange={(e) => setMinPrice(e.target.value)}
          className="form-input"
          style={{ width: '150px' }}
        />
        <input 
          type="number" 
          placeholder="Max Price (LKR)" 
          value={maxPrice} 
          onChange={(e) => setMaxPrice(e.target.value)}
          className="form-input"
          style={{ width: '150px' }}
        />
      </div>

      <div className="products-grid">
        {products.length === 0 ? <p>No products found.</p> : products.map(product => (
          <div key={product.id} className="product-card glass-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '200px', width: '100%', overflow: 'hidden', backgroundColor: '#f1f1f1' }}>
              <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="product-header">
                <span className="product-category">{product.category}</span>
                {product.stock <= 3 && product.stock > 0 && <span className="badge warning">Low Stock</span>}
                {product.stock === 0 && <span className="badge danger">Out of Stock</span>}
              </div>
              <h3 className="product-name">{product.name}</h3>
            <div className="product-price">LKR {Number(product.price).toLocaleString()}</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {product.stock} items available
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn" 
                onClick={() => setSelectedProduct(product)}
                style={{ flex: 1, border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', background: 'transparent' }}
              >
                View Details
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
                style={{ flex: 1 }}
              >
                {product.stock === 0 ? 'Sold Out' : 'Add to Cart'}
              </button>
            </div>
            </div>
            </div>
        ))}
      </div>

      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ height: '300px', width: '100%', backgroundColor: '#f1f1f1' }}>
              <img src={selectedProduct.image_url} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ padding: '2rem' }}>
              <span className="product-category" style={{ display: 'inline-block', padding: '0.2rem 0.5rem', background: 'var(--bg-primary)', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                {selectedProduct.category}
              </span>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{selectedProduct.name}</h2>
            <div className="product-price" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
              LKR {Number(selectedProduct.price).toLocaleString()}
            </div>
            
            <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Description</h4>
              <p>{selectedProduct.description || 'No description available for this product.'}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                <strong>{selectedProduct.stock}</strong> units currently in stock
              </span>
              <button 
                className="btn btn-primary"
                disabled={selectedProduct.stock === 0}
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
              >
                {selectedProduct.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 2. Cart Page
function CartPage({ cart, updateQuantity, cartTotal }) {
  const navigate = useNavigate();
  
  if (cart.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Add some products to proceed to checkout.</p>
        <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/')}>
          Return to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 className="modal-title">Shopping Cart</h2>
      <div className="cart-items">
        {cart.map(item => (
          <div key={item.product_id} className="cart-item">
            <div className="cart-item-info">
              <h4>{item.name}</h4>
              <div className="cart-item-price">LKR {Number(item.price).toLocaleString()}</div>
            </div>
            <div className="quantity-controls">
              <button className="qty-btn" onClick={() => updateQuantity(item.product_id, -1)}>-</button>
              <span className="qty-display">{item.quantity}</span>
              <button className="qty-btn" onClick={() => updateQuantity(item.product_id, 1)}>+</button>
            </div>
            <div style={{ width: '80px', textAlign: 'right', fontWeight: '600' }}>
              LKR {(item.price * item.quantity).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <div className="cart-total">
          <span>Total:</span>
          <span>LKR {cartTotal.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" onClick={() => navigate('/')} style={{ flex: 1, background: 'transparent', border: '1px solid var(--glass-border)' }}>
            Continue Shopping
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/payment')} style={{ flex: 1 }}>
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

// 3. Payment Gateway Page
function PaymentPage({ cart, clearCart, fetchProducts, showNotification }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState(null);

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
      return;
    }
    
    const reserveStock = async () => {
      try {
        const res = await axios.post(`${API_BASE}/checkout`, { items: cart });
        setOrderId(res.data.order_id);
        clearCart();
        showNotification('Items reserved! Please settle the payment...', 'success');
        fetchProducts();
      } catch (err) {
        showNotification(err.response?.data?.error || 'Failed to reserve stock', 'error');
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };
    
    reserveStock();
  }, []);

  const processPayment = async (outcome, cardNum = null) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/payments`, {
        order_id: orderId,
        outcome,
        card_number: cardNum
      });
      fetchProducts();
      navigate('/result', { state: { success: res.data.success, message: res.data.message, outcome } });
    } catch (err) {
      showNotification(err.response?.data?.error || 'Payment error', 'error');
      setLoading(false);
    }
  };

  const handlePay = (e) => {
    e.preventDefault();
    const cleanCard = cardNumber.replace(/\s+/g, '');
    
    if (cleanCard.length !== 16 || isNaN(Number(cleanCard))) {
      showNotification('Invalid Card Number! Payment Declined.', 'error');
      processPayment('failure', cleanCard);
    } else {
      processPayment('success', cleanCard);
    }
  };

  if (loading && !orderId) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h2>Reserving Stock...</h2>
        <div className="loader" style={{ marginTop: '1rem' }}></div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ maxWidth: '450px', margin: '0 auto' }}>
      <h2 className="modal-title">Payment Details</h2>
      <p className="modal-subtitle" style={{ marginBottom: '1.5rem' }}>
        Order #{orderId} • Items are kept aside for 5 minutes.
      </p>
      
      <div className="payment-card-visual">
        <div className="chip"></div>
        <div className="card-number-display">
          {cardNumber || '•••• •••• •••• ••••'}
        </div>
        <div className="card-details-display">
          <div>
            <div>Card Holder</div>
            <div style={{ color: 'white', marginTop: '4px' }}>{name || 'YOUR NAME'}</div>
          </div>
          <div>
            <div>Expires</div>
            <div style={{ color: 'white', marginTop: '4px' }}>{expiry || 'MM/YY'}</div>
          </div>
        </div>
      </div>

      <form className="payment-form" onSubmit={handlePay}>
        <div className="form-group">
          <label>Card Number (16 Digits)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="0000 0000 0000 0000"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            required
            disabled={loading}
          />
          <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
            * Note: Entering exactly 16 digits will trigger Payment Success.
          </small>
        </div>
        
        <div className="form-group">
          <label>Cardholder Name</label>
          <input type="text" className="form-input" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Expiry Date</label>
            <input type="text" className="form-input" placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} required disabled={loading} />
          </div>
          <div className="form-group">
            <label>CVV</label>
            <input type="password" className="form-input" placeholder="123" value={cvv} onChange={(e) => setCvv(e.target.value)} required disabled={loading} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }} disabled={loading}>
          {loading ? <div className="loader"></div> : 'Pay Securely'}
        </button>

        <button 
          type="button"
          className="btn" 
          onClick={async () => {
            setLoading(true);
            try {
              await axios.post(`${API_BASE}/orders/${orderId}/cancel`);
              fetchProducts();
              navigate('/result', { state: { success: false, message: 'Order Cancelled. Stock Restored.', outcome: 'cancelled' } });
            } catch (err) {
              showNotification(err.response?.data?.error || 'Error cancelling order', 'error');
              setLoading(false);
            }
          }} 
          disabled={loading}
          style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', marginTop: '1rem', width: '100%' }}
        >
          Cancel Order & Release Stock
        </button>
      </form>
    </div>
  );
}

// 4. Order Result Page
function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  if (!location.state) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>No Recent Orders</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>Go Home</button>
      </div>
    );
  }

  const { success, message } = location.state;

  return (
    <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{success ? '✅' : '❌'}</div>
      <h2>{success ? 'Payment Successful!' : 'Payment Failed'}</h2>
      <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem' }}>{message}</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>Continue Shopping</button>
      <button className="btn" onClick={() => navigate('/orders')} style={{ marginLeft: '1rem', background: 'transparent', border: '1px solid var(--glass-border)' }}>View Orders</button>
    </div>
  );
}

// 5. Order History Page
function OrderHistoryPage({ showNotification }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/orders`);
      setOrders(res.data);
    } catch (err) {
      showNotification('Failed to load order history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRefund = async (orderId) => {
    try {
      await axios.post(`${API_BASE}/orders/${orderId}/cancel`);
      showNotification('Refund successful. Stock returned.', 'success');
      fetchOrders();
    } catch (err) {
      showNotification(err.response?.data?.error || 'Refund failed', 'error');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><div className="loader"></div></div>;

  return (
    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 className="modal-title" style={{ marginBottom: '1.5rem' }}>Order History</h2>
      {orders.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No orders found.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map(order => (
            <div key={order.id} style={{ border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Order #{order.id}</h3>
                  <small style={{ color: 'var(--text-secondary)' }}>{new Date(order.created_at).toLocaleString()}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600 }}>LKR {Number(order.total_amount).toLocaleString()}</div>
                  <span className={`badge ${order.status === 'Paid' ? 'success' : order.status === 'Reserved' ? 'warning' : 'danger'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '1rem' }}>
                {order.items && order.items.map(item => (
                  <li key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <span>{item.quantity}x {item.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>LKR {Number(item.price * item.quantity).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
              {order.status === 'Paid' && (
                <button 
                  className="btn" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: '#ef4444', color: 'white', border: 'none' }}
                  onClick={() => {
                    if (window.confirm('Are you sure you want to refund and cancel this order?')) {
                      handleRefund(order.id);
                    }
                  }}
                >
                  Refund & Cancel Order
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
