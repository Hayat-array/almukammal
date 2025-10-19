// scripts/migrate-orders.js
await dbConnect();
const oldOrders = await db.collection('old_orders').find().toArray();
await Order.insertMany(oldOrders.map(order => ({
  orderNumber: order._id,
  customer: order.customer,
  items: order.items,
  totalAmount: order.totalAmount,
  status: order.status,
  orderDate: order.createdAt
})));
console.log('✅ Orders migrated!');