const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('./cron'); // Initialize the cron job

const app = express();
app.use(cors());
app.use(express.json());

// Simple health check route for Vercel
app.get('/', (req, res) => {
  res.send('TechLoom POS Backend is running successfully!');
});

// Helper function to expire 5-minute reservations (since cron doesn't run on Vercel serverless)
async function cleanupExpiredOrders() {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const [expiredOrders] = await connection.query(
      'SELECT id FROM orders WHERE status = \'Reserved\' AND created_at < NOW() - INTERVAL 5 MINUTE FOR UPDATE'
    );
    for (const row of expiredOrders) {
      const [items] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [row.id]);
      for (const item of items) {
        await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
      await connection.query('UPDATE orders SET status = \'Expired\' WHERE id = ?', [row.id]);
    }
    await connection.commit();
  } catch (err) {
    await connection.rollback();
  } finally {
    connection.release();
  }
}

// 1. Product & Inventory Management
app.get('/api/products', async (req, res) => {
  await cleanupExpiredOrders();
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product
app.post('/api/products', async (req, res) => {
  const { name, price, stock } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO products (name, price, stock) VALUES (?, ?, ?)',
      [name, price, stock]
    );
    res.json({ id: result.insertId, name, price, stock });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  const { name, price, stock } = req.body;
  try {
    await pool.query(
      'UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ?',
      [name, price, stock, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Cart & Order Creation with Stock Reservation
app.post('/api/checkout', async (req, res) => {
  const { items } = req.body; // items = [{ product_id, quantity, price }]
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    let total_amount = 0;
    
    // Sort items by product_id to prevent deadlocks
    items.sort((a, b) => a.product_id - b.product_id);

    // Validate stock and lock rows
    for (const item of items) {
      // FOR UPDATE locks the row until transaction completes
      const [productRows] = await connection.query(
        'SELECT stock, price FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );

      if (productRows.length === 0) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      const product = productRows[0];

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product_id}`);
      }

      total_amount += parseFloat(product.price) * item.quantity;
      
      // Reserve stock (decrement)
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Create the order with 'Reserved' status
    const [orderResult] = await connection.query(
      'INSERT INTO orders (total_amount, status) VALUES (?, \'Reserved\')',
      [total_amount]
    );

    const orderId = orderResult.insertId;

    // Create order items
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    await connection.commit();
    res.status(201).json({ order_id: orderId, total_amount, status: 'Reserved' });

  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// 3. Mock Payment System
app.post('/api/payments', async (req, res) => {
  const { order_id, outcome, card_number } = req.body; // outcome = 'success', 'failure', 'timeout'

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Lock the order row to prevent duplicate payments
    const [orderRows] = await connection.query(
      'SELECT status FROM orders WHERE id = ? FOR UPDATE',
      [order_id]
    );

    if (orderRows.length === 0) {
      throw new Error('Order not found');
    }

    const order = orderRows[0];

    // Reject duplicate payment for same order
    if (order.status !== 'Reserved') {
      throw new Error(`Order cannot be paid. Current status: ${order.status}`);
    }

    if (outcome === 'success') {
      // 60-second cooldown check to prevent accidental duplicate purchases
      if (card_number) {
        const [currentItems] = await connection.query('SELECT product_id FROM order_items WHERE order_id = ?', [order_id]);
        const productIds = currentItems.map(item => item.product_id);
        
        if (productIds.length > 0) {
          const [recentPurchases] = await connection.query(`
            SELECT 1 FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.status = 'Paid'
              AND o.card_number = ?
              AND o.updated_at > NOW() - INTERVAL 60 SECOND
              AND oi.product_id IN (?)
            LIMIT 1
          `, [card_number, productIds]);
          
          if (recentPurchases.length > 0) {
            // Revert stock due to duplicate purchase rule
            const [items] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [order_id]);
            for (const item of items) {
              await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
            }
            await connection.query('UPDATE orders SET status = \'Failed\' WHERE id = ?', [order_id]);
            await connection.commit();
            return res.status(429).json({ 
              success: false, 
              error: 'Duplicate purchase detected. Please wait 60 seconds to buy these items again with this card.' 
            });
          }
        }
      }

      await connection.query('UPDATE orders SET status = \'Paid\', card_number = ? WHERE id = ?', [card_number || null, order_id]);
      await connection.commit();
      return res.json({ success: true, message: 'Payment successful, order confirmed.' });
    } 
    
    if (outcome === 'failure' || outcome === 'timeout') {
      // Revert stock
      const [items] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [order_id]);
      
      for (const item of items) {
        await connection.query(
          'UPDATE products SET stock = stock + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
      
      const newStatus = outcome === 'failure' ? 'Failed' : 'Expired';
      await connection.query('UPDATE orders SET status = ? WHERE id = ?', [newStatus, order_id]);
      
      await connection.commit();
      return res.json({ success: false, message: `Payment ${outcome}. Stock released.` });
    }

    throw new Error('Invalid outcome');

  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Order Lifecycle (Cancellation)
app.post('/api/orders/:id/cancel', async (req, res) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const [orderRows] = await connection.query(
      'SELECT status FROM orders WHERE id = ? FOR UPDATE',
      [req.params.id]
    );

    if (orderRows.length === 0) {
      throw new Error('Order not found');
    }

    const order = orderRows[0];

    if (order.status !== 'Reserved' && order.status !== 'Pending') {
      throw new Error(`Cannot cancel order in status: ${order.status}`);
    }

    // Restore stock
    const [items] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [req.params.id]);
    for (const item of items) {
      await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await connection.query('UPDATE orders SET status = "Cancelled" WHERE id = ?', [req.params.id]);
    await connection.commit();

    res.json({ success: true, message: 'Order cancelled, stock restored.' });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});


if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`POS Backend running on port ${PORT}`);
  });
}

module.exports = app;
