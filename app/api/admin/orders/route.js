
// // // import { NextResponse } from 'next/server';
// // // import dbConnect from '@/lib/mongodb'; // ✅ FIXED! YOUR NAME!
// // // import Order from '@/models/Order';

// // // // ✅ ADMIN ORDERS API - WORKS WITH YOUR MONGODB!
// // // export async function GET(request) {
// // //   try {
// // //     // Connect to MongoDB (YOUR CODE!)
// // //     await dbConnect();

// // //     // ✅ ADMIN CHECK - PROTECTED!
// // //     const token = request.headers.get('authorization')?.replace('Bearer ', '');
// // //     if (!token) {
// // //       return NextResponse.json(
// // //         { success: false, error: 'Admin token required' },
// // //         { status: 401 }
// // //       );
// // //     }

// // //     // ✅ SIMPLE ADMIN CHECK (MOCK - REPLACE LATER)
// // //     const isAdmin = token.includes('admin'); // Simple check
// // //     if (!isAdmin) {
// // //       return NextResponse.json(
// // //         { success: false, error: 'Admin access required' },
// // //         { status: 403 }
// // //       );
// // //     }

// // //     // Fetch ALL orders
// // //     const orders = await Order.find({})
// // //       .populate('customer', 'name email')
// // //       .sort({ createdAt: -1 })
// // //       .limit(100);

// // //     return NextResponse.json({
// // //       success: true,
// // //       orders: orders.map(order => ({
// // //         _id: order._id.toString(),
// // //         orderNumber: order.orderNumber,
// // //         customer: order.customer,
// // //         items: order.items,
// // //         totalAmount: order.totalAmount,
// // //         status: order.status,
// // //         orderDate: order.createdAt,
// // //         trackingNumber: order.trackingNumber
// // //       }))
// // //     });

// // //   } catch (error) {
// // //     console.error('❌ Admin Orders API ERROR:', error);
// // //     return NextResponse.json(
// // //       { success: false, error: 'Server error' },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }
// // // C:\lap\laptop\Al_MUKAMMAL\app\api\admin\orders\route.js

// // import { NextResponse } from 'next/server';
// // import dbConnect from '@/lib/mongodb';
// // import Order from '@/models/Order';
// // import { verifyToken } from '@/lib/auth'; // Import your auth helper

// // export async function GET(request) {
// //   try {
// //     await dbConnect();

// //     // Get token from header
// //     const authHeader = request.headers.get('authorization');
// //     if (!authHeader || !authHeader.startsWith('Bearer ')) {
// //       return NextResponse.json(
// //         { success: false, error: 'Admin token required' },
// //         { status: 401 }
// //       );
// //     }

// //     const token = authHeader.replace('Bearer ', '');
    
// //     // Verify token and check admin role
// //     const decoded = verifyToken(token);
// //     if (!decoded) {
// //       return NextResponse.json(
// //         { success: false, error: 'Invalid token' },
// //         { status: 401 }
// //       );
// //     }

// //     // Check if user is admin (adjust based on your user model)
// //     if (!decoded.isAdmin && decoded.role !== 'admin') {
// //       return NextResponse.json(
// //         { success: false, error: 'Admin access required' },
// //         { status: 403 }
// //       );
// //     }

// //     // Fetch all orders
// //     const orders = await Order.find({})
// //       .populate('customer', 'name email')
// //       .sort({ createdAt: -1 })
// //       .limit(100);

// //     return NextResponse.json({
// //       success: true,
// //       orders: orders.map(order => ({
// //         _id: order._id.toString(),
// //         orderNumber: order.orderNumber,
// //         customer: order.customer,
// //         items: order.items,
// //         totalAmount: order.totalAmount,
// //         status: order.status,
// //         orderDate: order.createdAt,
// //         trackingNumber: order.trackingNumber
// //       }))
// //     });

// //   } catch (error) {
// //     console.error('❌ Admin Orders API ERROR:', error);
// //     return NextResponse.json(
// //       { success: false, error: 'Server error' },
// //       { status: 500 }
// //     );
// //   }
// // }
// import { NextResponse } from 'next/server';
// import dbConnect from '@/lib/mongodb';
// import Order from '@/models/Order';
// import { verifyToken } from '@/lib/auth'; // ✅ Use your proper auth helper

// // ✅ ADMIN GET ALL ORDERS
// export async function GET(request) {
//   try {
//     await dbConnect();

//     const authHeader = request.headers.get('authorization');
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return NextResponse.json({ success: false, error: 'Token required' }, { status: 401 });
//     }

//     const token = authHeader.replace('Bearer ', '');
//     const decoded = verifyToken(token);

//     // ✅ PROPER ADMIN CHECK
//     if (!decoded || decoded.role !== 'admin') {
//       return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
//     }

//     const orders = await Order.find({})
//       .populate('customer', 'name email')
//       .sort({ createdAt: -1 })
//       .limit(100);

//     return NextResponse.json({
//       success: true,
//       orders: orders.map(order => ({
//         _id: order._id.toString(),
//         orderNumber: order.orderNumber,
//         customer: order.customer,
//         items: order.items,
//         totalAmount: order.totalAmount,
//         status: order.status,
//         orderDate: order.createdAt,
//         trackingNumber: order.trackingNumber
//       }))
//     });

//   } catch (error) {
//     console.error('❌ Admin Orders API ERROR:', error);
//     return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
//   }
// }

// // ✅ ADMIN UPDATE ORDER STATUS
// export async function PATCH(request, { params }) {
//   try {
//     await dbConnect();
    
//     const authHeader = request.headers.get('authorization');
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return NextResponse.json({ success: false, error: 'Token required' }, { status: 401 });
//     }

//     const token = authHeader.replace('Bearer ', '');
//     const decoded = verifyToken(token);

//     if (!decoded || decoded.role !== 'admin') {
//       return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
//     }

//     const { status } = await request.json();
//     const { orderId } = params; // Get orderId from URL params

//     if (!status) {
//       return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
//     }

//     const order = await Order.findByIdAndUpdate(
//       orderId,
//       { status, updatedAt: new Date() },
//       { new: true }
//     ).populate('customer', 'name email');

//     if (!order) {
//       return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
//     }

//     console.log(`✅ ADMIN: Updated order ${orderId} to ${status}`);
//     return NextResponse.json({ success: true, order });

//   } catch (error) {
//     console.error('❌ Update Order Status Error:', error);
//     return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
//   }
// }
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Admin token required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all orders with pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;

    const orders = await Order.find({})
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments();

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        customer: order.customer,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        orderDate: order.createdAt,
        trackingNumber: order.trackingNumber
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Admin Orders API ERROR:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}