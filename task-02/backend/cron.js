const cron = require('node-cron');
const pool = require('./db');

// Run every minute
cron.schedule('* * * * *', async () => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Find all orders in 'Reserved' status that are older than 5 minutes
    const [expiredOrders] = await connection.query(`
      SELECT id FROM orders 
      WHERE status = 'Reserved' 
      AND created_at < NOW() - INTERVAL 5 MINUTE
      FOR UPDATE
    `);

    if (expiredOrders.length > 0) {
      console.log(`Found ${expiredOrders.length} expired orders.`);
      
      for (const order of expiredOrders) {
        const orderId = order.id;

        // 1. Get the items to restore stock
        const [items] = await connection.query(
          'SELECT product_id, quantity FROM order_items WHERE order_id = ?', 
          [orderId]
        );

        // 2. Restore stock for each product
        for (const item of items) {
          await connection.query(
            'UPDATE products SET stock = stock + ? WHERE id = ?',
            [item.quantity, item.product_id]
          );
        }

        // 3. Update order status to Expired
        await connection.query(
          'UPDATE orders SET status = "Expired" WHERE id = ?', 
          [orderId]
        );
        
        console.log(`Order ${orderId} expired and stock restored.`);
      }
    }
    
    await connection.commit();
  } catch (error) {
    console.error('Error expiring reservations:', error);
    await connection.rollback();
  } finally {
    connection.release();
  }
});
