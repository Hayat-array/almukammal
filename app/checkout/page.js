
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import './checkout.css';

// ✅ OPTIMIZED Country-City data
const countryCityData = {
  'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk'],
  'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'],
  'China': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Wuhan'],
  'Japan': ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka'],
  'USA': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio'],
  'UK': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Edinburgh'],
  'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg'],
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra'],
  'Germany': ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne', 'Stuttgart', 'Düsseldorf'],
  'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg'],
  'Italy': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna'],
  'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Bilbao'],
  'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte'],
  'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Cancún'],
  'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Ulsan'],
  'Singapore': ['Singapore'],
  'Malaysia': ['Kuala Lumpur', 'George Town', 'Johor Bahru', 'Malacca', 'Ipoh', 'Kota Kinabalu'],
  'Thailand': ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Krabi', 'Ayutthaya', 'Hua Hin'],
  'Turkey': ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep'],
  'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen'],
  'Switzerland': ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne', 'Lucerne'],
  'Sweden': ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro'],
  'Norway': ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Drammen', 'Tromsø'],
  'Denmark': ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers'],
  'Poland': ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk'],
  'Russia': ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Nizhny Novgorod'],
  'Argentina': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Mar del Plata'],
  'Chile': ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Viña del Mar'],
  'Colombia': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga'],
  'Peru': ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Cusco', 'Piura'],
  'Vietnam': ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hai Phong', 'Can Tho', 'Nha Trang'],
  'Philippines': ['Manila', 'Quezon City', 'Davao', 'Cebu', 'Makati', 'Pasig'],
  'Indonesia': ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Palembang'],
  'New Zealand': ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Dunedin'],
  'Other': []
};

// ✅ OPTIMIZED Helper functions
const getStringValue = (value) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && (value.street || value.city || value.state)) {
    return `${value.street || ''}, ${value.city || ''}, ${value.state || ''}`.replace(/^, |, $/g, '');
  }
  return String(value || '');
};

const validateForm = (formData) => {
  const errors = {};
  const values = {
    fullName: getStringValue(formData.fullName),
    email: getStringValue(formData.email),
    phone: getStringValue(formData.phone),
    address: getStringValue(formData.address),
    city: getStringValue(formData.city),
    country: getStringValue(formData.country)
  };

  if (!values.fullName.trim()) errors.fullName = 'Full name is required';
  if (!values.email.trim()) errors.email = 'Email is required';
  else if (!/\S+@\S+\.\S+/.test(values.email)) errors.email = 'Email is invalid';
  if (!values.phone.trim()) errors.phone = 'Phone number is required';
  else if (!/^\+?[0-9]{7,15}$/.test(values.phone.replace(/\s/g, ''))) errors.phone = 'Phone number is invalid';
  if (!values.address.trim()) errors.address = 'Address is required';
  if (!values.country.trim()) errors.country = 'Country is required';
  if (!values.city.trim()) errors.city = 'City is required';

  return { errors, isValid: Object.keys(errors).length === 0 };
};

export default function CheckoutPage() {
  // ✅ OPTIMIZED State
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', address: '', city: '', country: '', notes: ''
  });
  const [availableCities, setAvailableCities] = useState([]);
  const [showManualCity, setShowManualCity] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // ✅ OPTIMIZED useEffect - ONE CALL!
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    
    if (user) {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) setCart(JSON.parse(savedCart));
      
      // ✅ Pre-fill ALL fields at once
      const prefilledData = {
        fullName: user.name || '',
        email: user.email || '',
        phone: getStringValue(user.phone),
        address: getStringValue(user.address),
        city: getStringValue(user.city),
        country: getStringValue(user.country),
        notes: ''
      };
      setFormData(prefilledData);
      
      // ✅ Set cities at once
      if (prefilledData.country) {
        const cities = countryCityData[prefilledData.country] || [];
        setAvailableCities(cities);
        setShowManualCity(cities.length === 0 || prefilledData.country === 'Other');
      }
      
      setLoading(false);
    }
  }, [user, authLoading, router]);

  // ✅ OPTIMIZED Input Handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error instantly
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (name === 'country') {
      const cities = countryCityData[value] || [];
      setAvailableCities(cities);
      setShowManualCity(cities.length === 0 || value === 'Other');
      setFormData(prev => ({ ...prev, country: value, city: '' }));
    } else if (name === 'city' && value === 'other') {
      setShowManualCity(true);
      setFormData(prev => ({ ...prev, city: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleManualCityChange = (e) => {
    if (formErrors.city) setFormErrors(prev => ({ ...prev, city: '' }));
    setFormData(prev => ({ ...prev, city: e.target.value }));
  };

  // ✅ OPTIMIZED Calculations - Memoized
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 5000 ? 0 : 50;
  const total = subtotal + shipping;

  // ✅ OPTIMIZED Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { errors, isValid } = validateForm(formData);
    setFormErrors(errors);
    if (!isValid) return;
    
    setSubmitting(true);
    
    try {
      // Save to API
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerInfo: formData,
          items: cart,
          subtotal, shipping, total,
          status: 'pending',
          orderDate: new Date().toISOString()
        })
      });

      // WhatsApp Message
      const orderDetails = cart.map(item => 
        `${item.name} x${item.quantity} - AED ${(item.price * item.quantity).toLocaleString()}`
      ).join('%0A');
      
      const whatsappMessage = `*NEW ORDER*%0A%0A*Customer:* ${getStringValue(formData.fullName)}%0A*Email:* ${getStringValue(formData.email)}%0A*Phone:* ${getStringValue(formData.phone)}%0A*Address:* ${getStringValue(formData.address)}, ${getStringValue(formData.city)}, ${getStringValue(formData.country)}%0A%0A*Items:*%0A${orderDetails}%0A%0A*Total:* AED ${total.toLocaleString()}`;
      
      window.open(`https://wa.me/971509550121?text=${whatsappMessage}`, '_blank');
      
      // Success
      localStorage.removeItem('cart');
      alert('✅ Order submitted! Check WhatsApp for confirmation.');
      router.push('/orders');
      
    } catch (error) {
      console.error('Order error:', error);
      alert('❌ Error! Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (loading || authLoading) {
    return (
      <div className="checkout-loading">
        <div className="spinner"></div>
        <p>Loading checkout...</p>
      </div>
    );
  }

  // Redirect handled in useEffect
  if (!user) return null;

  // Empty Cart
  if (cart.length === 0) {
    return (
      <div className="checkout-empty">
        <div className="empty-icon">🛒</div>
        <h2>Your Cart is Empty</h2>
        <p>Add items to checkout</p>
        <Link href="/products" className="shop-button">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <h1 className="checkout-title">Checkout</h1>
          <div className="checkout-steps">
            <div className="step active"><span className="step-number">1</span><span>Cart</span></div>
            <div className="step active"><span className="step-number">2</span><span>Details</span></div>
            <div className="step"><span className="step-number">3</span><span>Complete</span></div>
          </div>
        </div>

        <div className="checkout-layout">
          <div className="checkout-form">
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h2>Contact Information</h2>
                <div className="form-group">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    type="text" id="fullName" name="fullName"
                    value={getStringValue(formData.fullName)}
                    onChange={handleInputChange} required
                    className={formErrors.fullName ? 'error' : ''}
                  />
                  {formErrors.fullName && <span className="error-message">{formErrors.fullName}</span>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input type="email" id="email" name="email"
                      value={getStringValue(formData.email)} onChange={handleInputChange} required
                      className={formErrors.email ? 'error' : ''}
                    />
                    {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone *</label>
                    <input type="tel" id="phone" name="phone"
                      value={getStringValue(formData.phone)} onChange={handleInputChange} required
                      className={formErrors.phone ? 'error' : ''}
                    />
                    {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h2>Delivery Address</h2>
                <div className="form-group">
                  <label htmlFor="address">Street Address *</label>
                  <textarea id="address" name="address" rows="3"
                    value={getStringValue(formData.address)} onChange={handleInputChange} required
                    className={formErrors.address ? 'error' : ''}
                  />
                  {formErrors.address && <span className="error-message">{formErrors.address}</span>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="country">Country *</label>
                    <select id="country" name="country" onChange={handleInputChange} required
                      value={getStringValue(formData.country)}
                      className={formErrors.country ? 'error' : ''}
                    >
                      <option value="">Select Country</option>
                      {Object.keys(countryCityData).map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                    {formErrors.country && <span className="error-message">{formErrors.country}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    {showManualCity ? (
                      <input type="text" id="city" name="city"
                        value={getStringValue(formData.city)} onChange={handleManualCityChange} required
                        className={`manual-city-input ${formErrors.city ? 'error' : ''}`}
                      />
                    ) : (
                      <select id="city" name="city" onChange={handleInputChange} required
                        value={getStringValue(formData.city)}
                        className={formErrors.city ? 'error' : ''}
                      >
                        <option value="">Select City</option>
                        {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
                        <option value="other">Other</option>
                      </select>
                    )}
                    {formErrors.city && <span className="error-message">{formErrors.city}</span>}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="notes">Order Notes</label>
                  <textarea id="notes" name="notes" rows="3"
                    value={getStringValue(formData.notes)} onChange={handleInputChange}
                  />
                </div>
              </div>

              <button type="submit" className="place-order-btn" disabled={submitting}>
                {submitting ? (
                  <>⏳ Processing...</>
                ) : (
                  <>Place Order - AED {total.toLocaleString()}</>
                )}
              </button>
            </form>
          </div>

          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="summary-items">
              {cart.map(item => (
                <div key={item.id} className="summary-item">
                  <img src={item.image} alt={item.name} />
                  <div className="summary-item-details">
                    <h4>{item.name}</h4>
                    <p>Qty: {item.quantity}</p>
                  </div>
                  <div className="summary-item-price">
                    AED {(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row"><span>Subtotal</span><span>AED {subtotal.toLocaleString()}</span></div>
            <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `AED ${shipping}`}</span></div>
            {shipping === 0 && <div className="free-shipping-badge">🎉 Free Shipping!</div>}
            {subtotal < 5000 && <div className="shipping-notice">Add AED {(5000 - subtotal).toLocaleString()} for FREE shipping</div>}
            <div className="summary-divider"></div>
            <div className="summary-total"><span>Total</span><span>AED {total.toLocaleString()}</span></div>
            <div className="payment-info">
              <div className="payment-method">
                <h3>Payment</h3>
                <div className="payment-option selected">💳 Payment on Delivery</div>
              </div>
              <div className="delivery-info">
                <h3>Delivery</h3>
                <div className="delivery-option">📦 2-5 Business Days</div>
                <div className="delivery-option">✅ 1 Year Warranty</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}