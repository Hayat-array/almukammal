'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import './checkout.css';

// Country-City data
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
  'Other': [] // For manual entry
};

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableCities, setAvailableCities] = useState([]);
  const [showManualCity, setShowManualCity] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    notes: ''
  });

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    setLoading(false);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'country') {
      const cities = countryCityData[value] || [];
      setAvailableCities(cities);
      setShowManualCity(cities.length === 0 || value === 'Other');
      setFormData({
        ...formData,
        country: value,
        city: '' // Reset city when country changes
      });
    } else if (name === 'city') {
      if (value === 'other') {
        // When "Other" is selected, show manual input field
        setShowManualCity(true);
        setFormData({
          ...formData,
          city: ''
        });
      } else {
        setFormData({
          ...formData,
          city: value
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleManualCityChange = (e) => {
    setFormData({
      ...formData,
      city: e.target.value
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 5000 ? 0 : 50;
  const total = subtotal + shipping;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const orderDetails = cart.map(item => 
      `${item.name} x${item.quantity} - AED ${(item.price * item.quantity).toLocaleString()}`
    ).join('%0A');

    const whatsappMessage = 
      `*NEW ORDER*%0A%0A` +
      `*Customer Details:*%0A` +
      `Name: ${formData.fullName}%0A` +
      `Email: ${formData.email}%0A` +
      `Phone: ${formData.phone}%0A` +
      `Address: ${formData.address}%0A` +
      `City: ${formData.city}%0A` +
      `Country: ${formData.country}%0A%0A` +
      `*Order Items:*%0A` +
      `${orderDetails}%0A%0A` +
      `*Order Summary:*%0A` +
      `Subtotal: AED ${subtotal.toLocaleString()}%0A` +
      `Shipping: ${shipping === 0 ? 'FREE' : `AED ${shipping}`}%0A` +
      `Total: AED ${total.toLocaleString()}%0A%0A` +
      `*Notes:* ${formData.notes || 'None'}`;

    const whatsappURL = `https://wa.me/971509550121?text=${whatsappMessage}`;
    window.open(whatsappURL, '_blank');

    setTimeout(() => {
      localStorage.removeItem('cart');
      alert('Order submitted! We will contact you shortly via WhatsApp.');
      window.location.href = '/';
    }, 1000);
  };

  if (loading) {
    return (
      <div className="checkout-loading">
        <div className="spinner"></div>
        <p>Loading checkout...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="checkout-empty">
        <div className="empty-icon">🛒</div>
        <h2>Your Cart is Empty</h2>
        <p>Add some items to your cart before checking out.</p>
        <Link href="/products" className="shop-button">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>

        <div className="checkout-layout">
          <div className="checkout-form">
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h2>Contact Information</h2>
                
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="+971 XX XXX XXXX"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h2>Delivery Address</h2>
                
                <div className="form-group">
                  <label>Street Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    placeholder="Building, Street, Area"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Country *</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Country</option>
                      {Object.keys(countryCityData).map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>City *</label>
                    {showManualCity ? (
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleManualCityChange}
                        required
                        placeholder="Enter your city name"
                        className="manual-city-input"
                      />
                    ) : (
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select City</option>
                        {availableCities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                        <option value="other">Other (Enter Manually)</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Order Notes (Optional)</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Any special instructions for delivery"
                  />
                </div>
              </div>

              <button type="submit" className="place-order-btn">
                Place Order - AED {total.toLocaleString()}
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

            <div className="summary-row">
              <span>Subtotal</span>
              <span>AED {subtotal.toLocaleString()}</span>
            </div>

            <div className="summary-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'FREE' : `AED ${shipping}`}</span>
            </div>

            {shipping === 0 && (
              <div className="free-shipping-badge">
                🎉 Free Shipping Applied!
              </div>
            )}

            <div className="summary-divider"></div>

            <div className="summary-total">
              <span>Total</span>
              <span>AED {total.toLocaleString()}</span>
            </div>

            <div className="payment-info">
              <p>💳 Payment on Delivery</p>
              <p>📦 Delivery in 2-5 business days</p>
              <p>✅ 1 Year Warranty</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}