# Al Mukammal — API Documentation

**Base URL:** `/api`  
**Protocol:** HTTPS  
**Content-Type:** `application/json`  
**Authentication Standard:** HTTP Authorization Header (`Bearer <JWT_TOKEN>`) & Session Cookies  

---

## 1. Standard Response Formats

### 1.1 Success Response Pattern
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### 1.2 Error Response Pattern
```json
{
  "success": false,
  "error": "Descriptive error message",
  "details": null
}
```

---

## 2. Authentication & Authorization APIs

### 2.1 Customer Login
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "customer@example.com",
    "password": "StrongPassword123!",
    "isAdminLogin": false
  }
  ```
- **Responses:**
  - `200 OK`: Returns `{ success: true, token: "...", user: { _id, name, email, role, phone, address, ... } }`
  - `400 Bad Request`: Missing email or password
  - `401 Unauthorized`: Invalid credentials
  - `403 Forbidden`: Role mismatch (e.g. admin attempting user login or vice versa)

### 2.2 Customer Registration
- **Endpoint:** `POST /api/auth/register`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "name": "Ahmed Al Mansoori",
    "email": "ahmed@example.com",
    "password": "StrongPassword123!",
    "phone": "+971501234567",
    "dob": "1995-05-15",
    "address": "Downtown Dubai, Building 4"
  }
  ```
- **Responses:**
  - `201 Created`: Returns `{ success: true, message: "User registered successfully", token: "...", user: { ... } }`
  - `400 Bad Request`: Missing required fields or password < 6 characters
  - `409 Conflict`: Email already registered

### 2.3 Identity Verification (Get Current User)
- **Endpoint:** `GET /api/auth/me`
- **Access:** Authenticated (`Bearer <token>`)
- **Responses:**
  - `200 OK`: Returns sanitized user profile document
  - `401 Unauthorized`: Missing or invalid token

### 2.4 Forgot Password (DOB Verification)
- **Endpoint:** `POST /api/auth/forgot-password`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "customer@example.com",
    "dob": "1995-05-15"
  }
  ```
- **Responses:**
  - `200 OK`: Returns `{ success: true, resetToken: "...", userId: "..." }`
  - `401 Unauthorized`: Date of birth does not match user account
  - `404 Not Found`: Email not found

### 2.5 Password Reset
- **Endpoint:** `POST /api/auth/reset-password`
- **Access:** Public (Requires valid resetToken)
- **Request Body:**
  ```json
  {
    "userId": "65b...",
    "resetToken": "...",
    "newPassword": "NewStrongPassword123!"
  }
  ```
- **Responses:**
  - `200 OK`: `{ success: true, message: "Password reset successfully" }`
  - `401 Unauthorized`: Expired or invalid token

---

## 3. Product Catalog APIs

### 3.1 Fetch Products (Public Storefront)
- **Endpoint:** `GET /api/products`
- **Access:** Public
- **Query Parameters:**
  - `page`: Page number (default: `1`)
  - `limit`: Items per page (default: `12` or `50`)
  - `search`: Search query string
  - `brand`: Filter by manufacturer brand
  - `category`: Filter by category (e.g. `'Laptops'`)
  - `sort`: Sorting option (`'newest'`, `'price-low'`, `'price-high'`, `'name'`)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "products": [
        {
          "id": "65b82...",
          "_id": "65b82...",
          "name": "Apple MacBook Pro 16\" M3 Max",
          "description": "Flagship Apple Silicon powerhouse...",
          "price": 14999,
          "discountedPrice": 13999,
          "discountBadge": "AED 1,000 OFF",
          "image": "macbook-16.jpg",
          "images": ["macbook-16.jpg", "macbook-16-side.jpg"],
          "specs": { "cpu": "M3 Max", "ram": "36GB", "storage": "1TB SSD", "gpu": "30-core GPU" },
          "brand": "Apple",
          "category": "Laptops",
          "stock": 12,
          "ratings": { "average": 4.9, "count": 28 }
        }
      ],
      "pagination": { "page": 1, "limit": 12, "total": 45, "pages": 4 }
    }
    ```

### 3.2 Fetch Single Product Detail
- **Endpoint:** `GET /api/products/[id]`
- **Access:** Public
- **Responses:**
  - `200 OK`: `{ product: { ... } }`
  - `404 Not Found`: `{ error: "Product not found" }`

---

## 4. Order & Checkout APIs

### 4.1 Create New Order
- **Endpoint:** `POST /api/orders`
- **Access:** Public / Customer
- **Security Check:** Live server recalculation of all item prices, coupon discounts, and delivery rules.
- **Request Body:**
  ```json
  {
    "customerInfo": {
      "fullName": "Rashid Al Nuaimi",
      "email": "rashid@example.com",
      "phone": "+971551234567",
      "address": "Al Barsha 1, Street 14",
      "city": "Dubai",
      "country": "UAE",
      "notes": "Please call before arrival"
    },
    "items": [
      { "id": "65b82...", "quantity": 1 }
    ],
    "couponCode": "WELCOME10"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "order": {
        "_id": "65c91...",
        "orderNumber": "ORD-1718001-A9BC4",
        "subtotal": 14999,
        "shipping": 0,
        "discountAmount": 1499.9,
        "totalAmount": 13499.1,
        "status": "pending"
      }
    }
    ```
  - `400 Bad Request`: Store closed, item out of stock, or validation failure

### 4.2 Validate Coupon
- **Endpoint:** `POST /api/checkout/validate-coupon`
- **Access:** Public / Customer
- **Request Body:** `{ "code": "SAVE500", "cartTotal": 5000 }`
- **Responses:**
  - `200 OK`: `{ success: true, coupon: { code: "SAVE500", type: "flat", value: 500, amount: 500 } }`
  - `400 Bad Request`: Expired, invalid, or minimum order threshold not met

### 4.3 Customer Order History
- **Endpoint:** `GET /api/orders/my`
- **Access:** Authenticated (`Bearer <token>`)
- **Responses:**
  - `200 OK`: `{ success: true, orders: [ ... ] }`
  - `401 Unauthorized`: Missing or invalid token

---

## 5. Administrative APIs (`role === 'admin'`)

### 5.1 Admin Overview Statistics
- **Endpoint:** `GET /api/admin/stats`
- **Access:** Admin only
- **Responses:**
  - `200 OK`: `{ success: true, stats: { users, admins, customers, orders, pendingOrders, completedOrders, products, totalRevenue } }`

### 5.2 Product Management
- `GET /api/admin/products` — List all products with admin controls
- `POST /api/admin/products` — Create new product with multipart form upload
- `PUT /api/admin/products/[id]` — Update existing product specifications and assets
- `DELETE /api/admin/products` — Delete specific product by ID
- `POST /api/admin/products/bulk-import` — Import array of product records with validation

### 5.3 Order Management
- `GET /api/admin/orders` — Paginated order inspection with filter by status
- `PATCH /api/admin/orders/[orderId]` — Update order fulfillment status and tracking number

### 5.4 Coupons & Discounts CRUD
- `GET /api/admin/coupons` & `POST /api/admin/coupons` & `DELETE /api/admin/coupons`
- `GET /api/admin/discounts` & `POST /api/admin/discounts` & `DELETE /api/admin/discounts`

### 5.5 Platform Settings
- `GET /api/settings/public` — Public operational rules (delivery threshold, store open status)
- `GET /api/admin/settings` — Admin view of all settings
- `PUT /api/admin/settings` — Update store hours, delivery pricing, emergency maintenance
