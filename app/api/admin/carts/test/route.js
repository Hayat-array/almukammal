// app/api/admin/carts/test/route.js
// Create this simple test endpoint first
import { NextResponse } from 'next/server';

export async function GET(request) {
  return NextResponse.json({ 
    success: true,
    message: 'API route is working!',
    timestamp: new Date().toISOString(),
    carts: [
      {
        userId: 'test-user-1',
        userName: 'Test User 1',
        userEmail: 'test1@example.com',
        items: [
          {
            id: '1',
            name: 'Test Product',
            price: 100,
            quantity: 2,
            image: 'https://via.placeholder.com/100'
          }
        ],
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        userId: 'test-user-2',
        userName: 'Test User 2',
        userEmail: 'test2@example.com',
        items: [],
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ]
  });
}