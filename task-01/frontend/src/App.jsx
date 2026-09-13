import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './index.css';
import './payment.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Toast Notification Component
const Toast = ({ message, type }) => (
  <div style={{
    position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
    padding: '1rem', borderRadius: '8px', color: 'white',
    background: type === 'error' ? 'var(--accent-danger)' : 'var(--accent-success)',
    boxShadow: 'var(--shadow-lg)', animation: 'slideUp 0.3s ease'
  }}>
    {message}
  </div>
);

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [notification, setNotification] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/products`);
      setProducts(res.data);
    } catch (err) {
      showNotification('Failed to fetch products', 'error');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showNotification('Not enough stock!', 'error');
          return prev;
        }
        return prev.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.price, quantity: 1, stock: product.stock }];
    });
    showNotification(`${product.name} added to cart`);
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product_id === productId) {
          const newQty = item.quantity + delta;
          if (newQty > item.stock) {
            showNotification('Exceeds available stock', 'error');
            return item;
          }
          if (newQty <= 0) return null;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const clearCart = () => setCart([]);

  return (
    <BrowserRouter>
      {notification && <Toast message={notification.message} type={notification.type} />}
      <div className="container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ marginBottom: 0 }}>TechLoom POS</h1>
          </Link>
          <Link to="/cart" className="btn btn-primary" style={{ width: 'auto' }}>
            Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </Link>
        </header>

        <Routes>
          <Route path="/" element={
            <ProductsPage products={products} addToCart={addToCart} fetchProducts={fetchProducts} />
          } />
          <Route path="/cart" element={
            <CartPage cart={cart} updateQuantity={updateQuantity} />
          } />
          <Route path="/payment" element={
            <PaymentPage cart={cart} clearCart={clearCart} fetchProducts={fetchProducts} showNotification={showNotification} />
          } />
          <Route path="/result" element={
            <ResultPage />
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

// 1. Products Page
function ProductsPage({ products, addToCart, fetchProducts }) {
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
        Available Items
      </h2>
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="glass-card product-card">
            <div>
              <div className="product-header">
                <h3 className="product-title">{product.name}</h3>
                <div className="product-price">LKR {parseFloat(product.price).toFixed(2)}</div>
              </div>
              <div className={`product-stock ${product.stock < 5 ? 'low' : ''}`}>
                {product.stock > 0 ? `${product.stock} available` : 'Finished'}
              </div>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
            >
              Add Item
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. Cart Page
function CartPage({ cart, updateQuantity }) {
  const navigate = useNavigate();
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 className="cart-title">Your Bill</h2>
      
      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No items added yet.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Browse Items</button>
        </div>
      ) : (
        <>
          {cart.map(item => (
            <div key={item.product_id} className="cart-item">
              <div className="cart-item-info">
                <h4>{item.name}</h4>
                <div className="cart-item-price">LKR {parseFloat(item.price).toFixed(2)}</div>
              </div>
              <div className="cart-item-actions">
                <button className="qty-btn" onClick={() => updateQuantity(item.product_id, -1)}>-</button>
                <span>{item.quantity}</span>
                <button className="qty-btn" onClick={() => updateQuantity(item.product_id, 1)}>+</button>
              </div>
            </div>
          ))}
          
          <div className="cart-total">
            <span>Total Amount</span>
            <span>LKR {cartTotal.toFixed(2)}</span>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button className="btn" style={{ background: '#475569', color: 'white' }} onClick={() => navigate('/')}>
              Back
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/payment')}>
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
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
    
    // Automatically call checkout API when arriving at this page to reserve stock
    const reserveStock = async () => {
      try {
        const res = await axios.post(`${API_BASE}/checkout`, { items: cart });
        setOrderId(res.data.order_id);
        clearCart();
        showNotification('Items reserved! Please settle the payment...', 'success');
        fetchProducts(); // refresh global products to update UI
      } catch (err) {
        showNotification(err.response?.data?.error || 'Failed to reserve stock', 'error');
        navigate('/cart'); // Send back to cart if stock reservation fails
      } finally {
        setLoading(false);
      }
    };
    
    reserveStock();
    // eslint-disable-next-line
  }, []);

  const processPayment = async (outcome, cardNum = null) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/payments`, {
        order_id: orderId,
        outcome,
        card_number: cardNum
      });
      fetchProducts(); // refresh products
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
      // Invalid card - force failure
      showNotification('Invalid Card Number! Payment Declined.', 'error');
      processPayment('failure', cleanCard);
    } else {
      // Valid 16-digit card - success
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
          <label>Card Number (Must be 16 digits for success)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="0000 0000 0000 0000"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>Cardholder Name</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Expiry Date</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>CVV</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
          {loading ? <div className="loader"></div> : 'Pay Now'}
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
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: '1rem', width: 'auto', display: 'inline-block' }}>Go Home</button>
      </div>
    );
  }

  const { success, message, outcome } = location.state;

  return (
    <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
        {success ? '✅' : '❌'}
      </div>
      <h2>{success ? 'Payment Successful!' : 'Payment Failed'}</h2>
      <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem' }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        {outcome === 'timeout' && (
          <p style={{ color: '#ef4444', marginBottom: '1.5rem', fontWeight: 500 }}>
            Your connection timed out. Stock has been returned to inventory.
          </p>
        )}
      </div>
      <button className="btn btn-primary" onClick={() => navigate('/')}>
        Start New Order
      </button>
    </div>
  );
}

export default App;
