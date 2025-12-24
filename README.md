# Al Mukammal - E-Commerce Platform

A full-stack e-commerce platform built with Next.js, MongoDB, and modern web technologies for selling laptops and electronics.

## 🚀 Features

### User Features
- **Authentication System**
  - User registration and login
  - Admin login (separate route)
  - JWT-based authentication
  - Password change with verification
  - Forgot password functionality
  - Account deletion with password + DOB verification

- **Product Browsing**
  - Product listing with search and filters
  - Product detail pages with image gallery
  - Color-based product variants
  - Multiple product images per color
  - Product specifications display
  - Breadcrumb navigation

- **Shopping Cart**
  - Add/remove products
  - User-specific cart storage
  - Cart persistence across sessions
  - Cart cleared on logout/login for different users

- **User Profile**
  - View and edit personal information
  - Comprehensive location selector (200+ countries)
  - State/district selection for major countries
  - Custom location input for unlisted regions
  - Password management
  - Account deletion
  - Display all user details (DOB, role, member since, etc.)

### Admin Features
- **Admin Dashboard**
  - Overview of orders, products, users
  - Quick access to all admin functions
  - Statistics and analytics

- **Product Management**
  - Add new products
  - Edit existing products
  - Delete products
  - Bulk product import (JSON)
  - Bulk delete all products (with verification)
  - Custom color management
  - Image upload with color assignment
  - Product specifications management

- **Order Management**
  - View all orders
  - Update order status
  - Order details view

- **User Management**
  - View all users
  - User role management
  - User account management

- **Custom Colors**
  - Add custom colors not in predefined list
  - Color name + hex code input
  - Color name displayed to users (hex code hidden)
  - Custom colors available for product selection

## 📁 Project Structure

```
Al_Mukammal/
├── app/
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication APIs
│   │   │   ├── login/           # User login
│   │   │   ├── register/        # User registration
│   │   │   └── me/              # Get current user
│   │   ├── admin/               # Admin APIs
│   │   │   ├── products/        # Product CRUD
│   │   │   │   ├── bulk-import/ # Bulk import products
│   │   │   │   └── delete-all/  # Delete all products
│   │   │   ├── orders/          # Order management
│   │   │   └── update-dob/      # Update users DOB
│   │   └── user/                # User APIs
│   │       ├── profile/         # Update profile
│   │       ├── password/        # Change password
│   │       └── delete/          # Delete account
│   ├── auth/                    # Auth Pages
│   │   ├── login/              # User login page
│   │   ├── register/           # User registration page
│   │   ├── forgot-password/    # Password reset page
│   │   └── admin/              # Admin routes
│   │       ├── login/          # Admin login page
│   │       ├── main/           # Admin dashboard
│   │       └── products/       # Product management
│   │           ├── edit/[id]/  # Edit product
│   │           └── bulk-import/ # Bulk import UI
│   ├── products/               # Product Pages
│   │   ├── [id]/              # Product detail page
│   │   └── page.js            # Products listing
│   ├── profile/               # User profile page
│   ├── cart/                  # Shopping cart page
│   ├── admin/                 # Admin main page
│   ├── ClientLayout.js        # Main layout component
│   └── page.js                # Homepage
├── contexts/
│   └── AuthContext.js         # Authentication context
├── models/
│   ├── User.js               # User model
│   ├── ProductModel.js       # Product model
│   └── Order.js              # Order model
├── lib/
│   └── mongodb.js            # MongoDB connection
├── data/
│   └── countries.js          # Countries and states data
├── scripts/
│   └── updateUsersDOB.js     # Script to update users DOB
├── public/
│   ├── images/               # Static images
│   └── update-dob.html       # DOB update utility
├── middleware.js             # Route protection middleware
├── .env.local               # Environment variables
└── package.json             # Dependencies

```

## 🔑 Key Pages

### Public Pages
1. **Homepage** (`/`) - Landing page with featured products
2. **Products** (`/products`) - Product listing with filters
3. **Product Detail** (`/products/[id]`) - Individual product page
4. **Login** (`/auth/login`) - User login
5. **Register** (`/auth/register`) - User registration
6. **Forgot Password** (`/auth/forgot-password`) - Password reset

### User Pages (Protected)
1. **Profile** (`/profile`) - User profile management
2. **Cart** (`/cart`) - Shopping cart
3. **Orders** (`/orders`) - User order history

### Admin Pages (Admin Only)
1. **Admin Dashboard** (`/admin`) - Main admin dashboard
2. **Admin Login** (`/auth/admin/login`) - Admin authentication
3. **Admin Main** (`/auth/admin/main`) - Detailed admin dashboard
4. **Product Management** (`/auth/admin/products/edit/[id]`) - Edit products
5. **Bulk Import** (`/auth/admin/products/bulk-import`) - Import products via JSON
6. **Order Management** (`/admin/orders`) - Manage orders
7. **User Management** (`/admin/users`) - Manage users

## 🛠️ Technologies Used

- **Frontend**: Next.js 14, React, JavaScript
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Styling**: Inline CSS (custom styling)
- **File Upload**: Multipart form data
- **State Management**: React Context API

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Steps

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Al_Mukammal
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/al_mukammal
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/al_mukammal

# JWT Secret (use a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
```
http://localhost:3000
```

## 🔐 Default Admin Account

Create an admin account manually in MongoDB or use the registration with role modification:

```javascript
// In MongoDB, update a user to admin:
db.users.updateOne(
  { email: "admin@almukammal.com" },
  { $set: { role: "admin" } }
)
```

## 🌐 Hosting Instructions

### Option 1: Vercel (Recommended for Next.js)

1. **Prepare for deployment**
```bash
npm run build
```

2. **Install Vercel CLI**
```bash
npm install -g vercel
```

3. **Deploy to Vercel**
```bash
vercel
```

4. **Set environment variables in Vercel**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add:
     - `MONGODB_URI` - Your MongoDB Atlas connection string
     - `JWT_SECRET` - Your JWT secret key
     - `NEXT_PUBLIC_API_URL` - Your production URL

5. **Deploy**
```bash
vercel --prod
```

### Option 2: Railway

1. **Create account** at [railway.app](https://railway.app)

2. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

3. **Login**
```bash
railway login
```

4. **Initialize project**
```bash
railway init
```

5. **Add environment variables**
```bash
railway variables set MONGODB_URI="your-mongodb-uri"
railway variables set JWT_SECRET="your-jwt-secret"
```

6. **Deploy**
```bash
railway up
```

### Option 3: Netlify

1. **Build the project**
```bash
npm run build
```

2. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

3. **Deploy**
```bash
netlify deploy --prod
```

4. **Set environment variables**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add `MONGODB_URI` and `JWT_SECRET`

### Option 4: DigitalOcean / AWS / VPS

1. **Set up a VPS** (Ubuntu 22.04 recommended)

2. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Install PM2** (Process Manager)
```bash
sudo npm install -g pm2
```

4. **Clone your repository**
```bash
git clone <your-repo-url>
cd Al_Mukammal
```

5. **Install dependencies**
```bash
npm install
```

6. **Create .env.local file**
```bash
nano .env.local
# Add your environment variables
```

7. **Build the project**
```bash
npm run build
```

8. **Start with PM2**
```bash
pm2 start npm --name "al-mukammal" -- start
pm2 save
pm2 startup
```

9. **Set up Nginx as reverse proxy**
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/almukammal
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

10. **Enable the site**
```bash
sudo ln -s /etc/nginx/sites-available/almukammal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

11. **Set up SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 📊 Database Setup

### MongoDB Atlas (Cloud - Recommended)

1. **Create account** at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Create a cluster** (Free tier available)

3. **Get connection string**
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

4. **Whitelist IP addresses**
   - Network Access → Add IP Address
   - For development: Add your current IP
   - For production: Add `0.0.0.0/0` (allow from anywhere)

5. **Update .env.local**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/al_mukammal?retryWrites=true&w=majority
```

### Local MongoDB

1. **Install MongoDB**
```bash
# Ubuntu
sudo apt-get install mongodb

# macOS
brew install mongodb-community

# Windows
# Download from mongodb.com
```

2. **Start MongoDB**
```bash
sudo systemctl start mongodb
```

3. **Use local connection**
```env
MONGODB_URI=mongodb://localhost:27017/al_mukammal
```

## 🔧 Configuration

### Image Upload Directory
Images are stored in `public/images/products/`

Make sure this directory exists and has write permissions:
```bash
mkdir -p public/images/products
chmod 755 public/images/products
```

### Custom Colors
Custom colors are stored in component state. To persist them:
1. Add a `CustomColor` model in MongoDB
2. Save custom colors to database
3. Load on component mount

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### User
- `PUT /api/user/profile` - Update profile
- `PUT /api/user/password` - Change password
- `DELETE /api/user/delete` - Delete account

### Admin - Products
- `GET /api/admin/products` - Get all products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/[id]` - Update product
- `DELETE /api/admin/products/[id]` - Delete product
- `POST /api/admin/products/bulk-import` - Bulk import
- `POST /api/admin/products/delete-all` - Delete all products

### Admin - Orders
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/[id]` - Update order status

### Admin - Users
- `GET /api/admin/users` - Get all users
- `POST /api/admin/update-dob` - Update users DOB

## 🎨 Features Detail

### User-Specific Cart
- Cart data stored in `localStorage` with user ID
- Format: `cart_<userId>`
- Cleared on logout
- Loaded on login
- Prevents cart sharing between users

### Location Selector
- 200+ countries available
- 15 major countries with states/districts
- Custom location input for unlisted regions
- State field shows conditionally based on country

### Custom Colors
- Admin can add custom colors
- Color name + hex code
- Hex code hidden from users
- Available in product selection
- Shows with color dot preview

### Password Security
- bcrypt hashing (10 rounds)
- Current password verification for changes
- Password + DOB verification for account deletion
- JWT token expiration: 7 days

### Image Management
- Multiple images per product
- Color-based image assignment
- Image roles: Main, Side, Back, Extra
- Filter images by color
- Upload new images or use existing URLs

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongodb

# Restart MongoDB
sudo systemctl restart mongodb

# Check connection string format
mongodb://localhost:27017/al_mukammal
```

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Image Upload Issues
```bash
# Check directory permissions
ls -la public/images/

# Create directory if missing
mkdir -p public/images/products

# Set permissions
chmod 755 public/images/products
```

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Support

For support, email: support@almukammal.com

## 🔄 Updates

To update the application:
```bash
git pull origin main
npm install
npm run build
pm2 restart al-mukammal
```

## 🎯 Production Checklist

Before deploying to production:

- [ ] Update `JWT_SECRET` to a strong random string
- [ ] Set up MongoDB Atlas with proper security
- [ ] Configure environment variables in hosting platform
- [ ] Enable HTTPS/SSL certificate
- [ ] Set up proper error logging
- [ ] Configure CORS if needed
- [ ] Set up database backups
- [ ] Test all authentication flows
- [ ] Test payment integration (if applicable)
- [ ] Set up monitoring and analytics
- [ ] Configure email service for password reset
- [ ] Review and update security headers
- [ ] Optimize images and assets
- [ ] Set up CDN for static assets
- [ ] Configure rate limiting for APIs
- [ ] Set up automated backups

## 🚀 Performance Optimization

1. **Enable caching**
2. **Optimize images** (use Next.js Image component)
3. **Implement lazy loading**
4. **Use CDN for static assets**
5. **Enable gzip compression**
6. **Minimize bundle size**

---

**Built with ❤️ for Al Mukammal**
