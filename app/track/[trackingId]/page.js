'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import ClientLayout from '../../ClientLayout';

export default function TrackOrderDetailPage({ params }) {
  const unwrappedParams = use(params);
  const trackingIdParam = unwrappedParams.trackingId;

  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveLocation, setLiveLocation] = useState(null);

  // Reschedule modal state
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('Standard (10:00 AM - 06:00 PM)');
  const [rescheduleReason, setRescheduleReason] = useState('Customer preference');
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState('');

  // Fetch initial tracking data
  useEffect(() => {
    let isMounted = true;

    async function loadTracking() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/track/${encodeURIComponent(trackingIdParam)}`);
        const data = await res.json();

        if (isMounted) {
          if (res.ok && data.success) {
            setTracking(data.tracking);
            if (data.tracking.currentLocation) {
              setLiveLocation(data.tracking.currentLocation);
            }
          } else {
            setError(data.error || 'Tracking details not found.');
          }
        }
      } catch (err) {
        if (isMounted) setError('Network error while retrieving tracking data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTracking();

    return () => { isMounted = false; };
  }, [trackingIdParam]);

  // Connect to Server-Sent Events (SSE) for live GPS and status updates
  useEffect(() => {
    if (!trackingIdParam) return;

    let eventSource = null;
    try {
      eventSource = new EventSource(`/api/shipments/${encodeURIComponent(trackingIdParam)}/stream`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'STATUS_CHANGE') {
            setTracking(prev => prev ? {
              ...prev,
              status: payload.status,
              timeline: [
                ...prev.timeline,
                {
                  eventId: `evt_${Date.now()}`,
                  status: payload.status,
                  title: payload.title,
                  description: payload.description,
                  timestamp: payload.timestamp
                }
              ]
            } : prev);
          } else if (payload.type === 'LOCATION_UPDATE') {
            setLiveLocation(payload.location);
          }
        } catch {
          // Ignore parse errors on heartbeats
        }
      };
    } catch {
      // Graceful fallback on SSE connection error
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [trackingIdParam]);

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleDate) return;
    setRescheduling(true);
    setRescheduleSuccess('');

    try {
      const res = await fetch(`/api/shipments/${encodeURIComponent(trackingIdParam)}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedDate: rescheduleDate,
          timeSlot: rescheduleSlot,
          reason: rescheduleReason
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRescheduleSuccess('Delivery successfully rescheduled! Your timeline has been updated.');
        setTracking(prev => prev ? { ...prev, estimatedDelivery: data.estimatedDelivery, status: 'RESCHEDULED' } : prev);
        setTimeout(() => setShowReschedule(false), 2000);
      } else {
        alert(data.error || 'Failed to reschedule');
      }
    } catch {
      alert('Network error submitting reschedule request.');
    } finally {
      setRescheduling(false);
    }
  };

  // Standard visual stages
  const STAGES = [
    { key: 'ORDER_PLACED', label: 'Order Placed', desc: 'Verified by Store' },
    { key: 'CONFIRMED', label: 'Confirmed', desc: 'Payment Approved' },
    { key: 'PROCESSING', label: 'Processing', desc: 'Hardware Inspection' },
    { key: 'PACKED', label: 'Packed', desc: 'Sealed for Dispatch' },
    { key: 'SHIPPED', label: 'Shipped', desc: 'Handed to Logistics' },
    { key: 'IN_TRANSIT', label: 'In Transit', desc: 'En Route to Hub' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'With Fleet Driver' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Signed & Handed Over' }
  ];

  const getStageIndex = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'DELIVERED') return 7;
    if (s === 'OUT_FOR_DELIVERY' || s === 'ARRIVED_AT_DESTINATION') return 6;
    if (s === 'IN_TRANSIT') return 5;
    if (s === 'SHIPPED' || s === 'PICKED_UP' || s === 'ASSIGNED') return 4;
    if (s === 'PACKED' || s === 'READY_FOR_SHIPMENT') return 3;
    if (s === 'PROCESSING') return 2;
    if (s === 'CONFIRMED') return 1;
    return 0; // PENDING / CREATED
  };

  const currentStageIndex = getStageIndex(tracking?.status);

  return (
    <ClientLayout>
      <div className="tracking-page-root">
        <div className="tracking-container">
          {/* Breadcrumb / Top Bar */}
          <div className="top-nav">
            <Link href="/track" className="back-link">
              ← Search Another Tracking ID
            </Link>
            <div className="status-pill">
              <span className="live-dot" />
              <span>Live Updates Active</span>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Contacting Al Mukammal Logistics Servers...</p>
            </div>
          ) : error ? (
            <div className="error-card">
              <div className="error-icon">⚠️</div>
              <h2>Shipment Not Found</h2>
              <p>{error}</p>
              <Link href="/track" className="action-btn">
                Try Another Tracking Number
              </Link>
            </div>
          ) : tracking ? (
            <div className="tracking-grid">
              {/* MAIN COLUMN */}
              <div className="main-col">
                {/* Header Card */}
                <div className="hero-card">
                  <div className="hero-top">
                    <div>
                      <span className="carrier-tag">Al Mukammal Dedicated Fleet</span>
                      <h1 className="tracking-title">{tracking.trackingId}</h1>
                      <div className="order-ref">
                        Order Reference: <strong>#{tracking.orderNumber}</strong>
                      </div>
                    </div>

                    <div className="status-badge-hero">
                      <span className="badge-text">{tracking.status.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  <div className="hero-stats">
                    <div className="stat-item">
                      <span className="stat-label">Estimated Delivery</span>
                      <span className="stat-val highlight">{tracking.estimatedDelivery}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Destination</span>
                      <span className="stat-val">{tracking.destinationArea}, {tracking.destinationCity}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Recipient</span>
                      <span className="stat-val">{tracking.customerMaskedName}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Stepper Timeline */}
                <div className="stepper-card">
                  <h2 className="section-title">Delivery Progress</h2>

                  <div className="stepper-wrapper">
                    {STAGES.map((stage, idx) => {
                      const isCompleted = idx < currentStageIndex;
                      const isCurrent = idx === currentStageIndex;
                      const isPending = idx > currentStageIndex;

                      return (
                        <div
                          key={stage.key}
                          className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}
                        >
                          <div className="step-indicator">
                            {isCompleted ? (
                              <span className="check-mark">✓</span>
                            ) : (
                              <span className="step-num">{idx + 1}</span>
                            )}
                          </div>
                          <div className="step-content">
                            <span className="step-label">{stage.label}</span>
                            <span className="step-sub">{stage.desc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Courier GPS & Map Card */}
                <div className="map-card">
                  <div className="map-card-header">
                    <div>
                      <h2 className="section-title" style={{ margin: 0 }}>Courier Live Route</h2>
                      <p className="map-subtitle">Real-time GPS coordinates via UAE Dispatch Satellites</p>
                    </div>

                    {liveLocation && (
                      <span className="gps-live-badge">
                        <span className="live-dot" /> Lat: {liveLocation.lat.toFixed(4)}, Lng: {liveLocation.lng.toFixed(4)}
                      </span>
                    )}
                  </div>

                  {/* Stylized Visual GPS Radar */}
                  <div className="gps-viewport">
                    <div className="grid-overlay" />
                    
                    {/* Deira Showroom Hub Marker */}
                    <div className="hub-marker">
                      <span className="marker-pin">🏢</span>
                      <span className="marker-label">Al Mukammal Central Hub (Deira)</span>
                    </div>

                    {/* Customer Destination Marker */}
                    <div className="dest-marker">
                      <span className="marker-pin">📍</span>
                      <span className="marker-label">{tracking.destinationArea || 'Destination Sector'}</span>
                    </div>

                    {/* Active Courier Driver Van Marker */}
                    <div className="courier-marker">
                      <span className="van-icon">🚐</span>
                      <span className="courier-radar" />
                      <span className="marker-label">
                        {tracking.deliveryPartner?.name || 'Al Mukammal Courier Fleet'}
                      </span>
                    </div>
                  </div>

                  <div className="map-footer">
                    <span>
                      {tracking.status === 'OUT_FOR_DELIVERY'
                        ? '🟢 Courier is actively on route to your building. Please keep your phone reachable.'
                        : 'ℹ️ Real-time driver location will activate once driver starts final-mile delivery.'}
                    </span>
                  </div>
                </div>

                {/* Audit Event Timeline */}
                <div className="events-card">
                  <h2 className="section-title">Milestone Activity Log</h2>
                  <div className="events-list">
                    {tracking.timeline && tracking.timeline.map((evt, idx) => (
                      <div key={idx} className="event-row">
                        <div className="event-dot" />
                        <div className="event-info">
                          <div className="event-header">
                            <span className="event-title">{evt.title}</span>
                            <span className="event-time">{new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="event-desc">{evt.description}</p>
                          <span className="event-loc">📍 {evt.location}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SIDEBAR COLUMN */}
              <div className="side-col">
                {/* Delivery Partner Profile Card */}
                {tracking.deliveryPartner ? (
                  <div className="sidebar-card partner-card">
                    <div className="partner-avatar">👤</div>
                    <div className="partner-info">
                      <span className="partner-role">Assigned Delivery Partner</span>
                      <h3 className="partner-name">{tracking.deliveryPartner.name}</h3>
                      <span className="partner-vehicle">Fleet Van • Dubai Sector</span>
                    </div>

                    <a
                      href={`tel:${tracking.deliveryPartner.phoneMasked}`}
                      className="call-btn"
                    >
                      📞 Call Courier ({tracking.deliveryPartner.phoneMasked})
                    </a>
                  </div>
                ) : (
                  <div className="sidebar-card unassigned-card">
                    <h3>Warehouse Dispatch In Progress</h3>
                    <p>Your package is undergoing serial verification. An Al Mukammal delivery partner will be assigned shortly.</p>
                  </div>
                )}

                {/* Reschedule Action Card */}
                <div className="sidebar-card">
                  <h3>Need to Reschedule?</h3>
                  <p>Not available to receive today? Select a convenient upcoming date or time window.</p>
                  <button
                    onClick={() => setShowReschedule(true)}
                    className="secondary-btn"
                  >
                    📅 Reschedule Delivery
                  </button>
                </div>

                {/* WhatsApp Live Support Desk */}
                <div className="sidebar-card vip-support-card">
                  <div className="vip-badge">Deira VIP Desk</div>
                  <h3>Direct WhatsApp Assistance</h3>
                  <p>Inquire directly with our Dubai store team regarding this specific shipment.</p>
                  <a
                    href={`https://wa.me/971509550121?text=${encodeURIComponent(`Hello Al Mukammal Logistics, I am inquiring regarding my Tracking ID ${tracking.trackingId} (Order #${tracking.orderNumber}).`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-btn"
                  >
                    💬 Chat with Showroom Support
                  </a>
                </div>
              </div>
            </div>
          ) : null}

          {/* Reschedule Modal Dialog */}
          {showReschedule && (
            <div className="modal-backdrop">
              <div className="modal-card">
                <div className="modal-header">
                  <h2>Reschedule Delivery Date</h2>
                  <button onClick={() => setShowReschedule(false)} className="close-btn">✕</button>
                </div>

                {rescheduleSuccess ? (
                  <div className="success-banner">{rescheduleSuccess}</div>
                ) : (
                  <form onSubmit={handleRescheduleSubmit} className="modal-form">
                    <div className="form-group">
                      <label>Preferred Delivery Date:</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        required
                        className="modal-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Preferred Time Window:</label>
                      <select
                        value={rescheduleSlot}
                        onChange={(e) => setRescheduleSlot(e.target.value)}
                        className="modal-input"
                      >
                        <option value="Morning (10:00 AM - 02:00 PM)">Morning (10:00 AM - 02:00 PM)</option>
                        <option value="Afternoon (02:00 PM - 06:00 PM)">Afternoon (02:00 PM - 06:00 PM)</option>
                        <option value="Evening (06:00 PM - 09:30 PM)">Evening (06:00 PM - 09:30 PM)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Reason for Rescheduling:</label>
                      <select
                        value={rescheduleReason}
                        onChange={(e) => setRescheduleReason(e.target.value)}
                        className="modal-input"
                      >
                        <option value="Customer unavailable at address">Not available at location today</option>
                        <option value="Travel / Out of town">Travelling out of town</option>
                        <option value="Office timing preference">Prefer delivery during office hours</option>
                        <option value="Other">Other preference</option>
                      </select>
                    </div>

                    <div className="modal-actions">
                      <button type="button" onClick={() => setShowReschedule(false)} className="cancel-btn">
                        Cancel
                      </button>
                      <button type="submit" disabled={rescheduling || !rescheduleDate} className="confirm-btn">
                        {rescheduling ? 'Submitting...' : 'Confirm Reschedule'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .tracking-page-root {
          min-height: 90vh;
          background: #F8FAFC;
          padding: 40px 16px 80px;
          color: #0F172A;
        }

        .tracking-container {
          max-width: 1280px;
          margin: 0 auto;
        }

        .top-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .back-link {
          color: #0866FF;
          font-weight: 700;
          font-size: 0.92rem;
          text-decoration: none;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #10B981;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 8px #10B981;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }

        .loading-state, .error-card {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 60px 20px;
          text-align: center;
          border: 1px solid #E2E8F0;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #E2E8F0;
          border-top-color: #0866FF;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .tracking-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 28px;
        }

        @media (min-width: 1024px) {
          .tracking-grid {
            grid-template-columns: 1fr 380px;
          }
        }

        .hero-card {
          background: #0B0B0D;
          color: #FFFFFF;
          border-radius: 28px;
          padding: 36px;
          margin-bottom: 28px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .hero-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 28px;
        }

        .carrier-tag {
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #38BDF8;
          font-weight: 750;
        }

        .tracking-title {
          font-size: clamp(1.8rem, 3.5vw, 2.6rem);
          font-weight: 850;
          letter-spacing: -0.02em;
          margin: 4px 0 6px;
        }

        .order-ref {
          font-size: 0.95rem;
          color: #94A3B8;
        }

        .status-badge-hero {
          background: rgba(8, 102, 255, 0.2);
          border: 1px solid #3B82F6;
          color: #93C5FD;
          padding: 8px 18px;
          border-radius: 9999px;
          font-weight: 800;
          font-size: 0.88rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }

        .stat-label {
          display: block;
          font-size: 0.8rem;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 4px;
        }

        .stat-val {
          font-size: 1.05rem;
          font-weight: 750;
        }

        .stat-val.highlight {
          color: #34D399;
        }

        .stepper-card, .map-card, .events-card, .sidebar-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 24px;
          padding: 28px;
          margin-bottom: 28px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 850;
          color: #0F172A;
          margin: 0 0 20px;
        }

        /* Stepper */
        .stepper-wrapper {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 16px;
          position: relative;
        }

        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
        }

        .step-indicator {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          margin-bottom: 10px;
          transition: all 0.2s ease;
        }

        .step-item.completed .step-indicator {
          background: #10B981;
          color: #FFFFFF;
        }

        .step-item.current .step-indicator {
          background: #0866FF;
          color: #FFFFFF;
          box-shadow: 0 0 0 6px rgba(8, 102, 255, 0.2);
          transform: scale(1.1);
        }

        .step-item.pending .step-indicator {
          background: #F1F5F9;
          color: #94A3B8;
        }

        .step-label {
          font-size: 0.85rem;
          font-weight: 750;
          color: #0F172A;
          margin-bottom: 2px;
        }

        .step-sub {
          font-size: 0.72rem;
          color: #64748B;
        }

        /* GPS Radar */
        .map-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .map-subtitle {
          font-size: 0.88rem;
          color: #64748B;
          margin: 4px 0 0;
        }

        .gps-live-badge {
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          color: #065F46;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 0.78rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .gps-viewport {
          height: 240px;
          background: #0F172A;
          border-radius: 18px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 20px;
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        .hub-marker, .dest-marker, .courier-marker {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #FFFFFF;
          text-align: center;
        }

        .marker-pin, .van-icon {
          font-size: 2rem;
          margin-bottom: 6px;
        }

        .marker-label {
          font-size: 0.75rem;
          font-weight: 700;
          background: rgba(0, 0, 0, 0.6);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .courier-marker {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .map-footer {
          margin-top: 14px;
          font-size: 0.85rem;
          color: #64748B;
        }

        /* Milestones */
        .events-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
          border-left: 2px solid #E2E8F0;
          padding-left: 20px;
          margin-left: 10px;
        }

        .event-row {
          position: relative;
        }

        .event-dot {
          position: absolute;
          left: -27px;
          top: 4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #0866FF;
          border: 2px solid #FFFFFF;
        }

        .event-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.92rem;
          font-weight: 750;
        }

        .event-desc {
          font-size: 0.86rem;
          color: #475569;
          margin: 4px 0 2px;
        }

        .event-loc {
          font-size: 0.78rem;
          color: #94A3B8;
        }

        /* Sidebar Elements */
        .partner-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          text-align: center;
        }

        .partner-avatar {
          font-size: 2.4rem;
          margin-bottom: 10px;
        }

        .partner-role {
          font-size: 0.78rem;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
        }

        .partner-name {
          font-size: 1.2rem;
          font-weight: 850;
          margin: 2px 0 4px;
        }

        .partner-vehicle {
          font-size: 0.85rem;
          color: #94A3B8;
          display: block;
          margin-bottom: 16px;
        }

        .call-btn, .whatsapp-btn, .secondary-btn, .confirm-btn {
          display: block;
          width: 100%;
          padding: 12px 18px;
          border-radius: 9999px;
          font-weight: 750;
          text-align: center;
          text-decoration: none;
          font-size: 0.92rem;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .call-btn {
          background: #0F172A;
          color: #FFFFFF;
        }

        .call-btn:hover {
          background: #0866FF;
        }

        .secondary-btn {
          background: #F1F5F9;
          color: #0F172A;
        }

        .secondary-btn:hover {
          background: #E2E8F0;
        }

        .whatsapp-btn {
          background: #25D366;
          color: #FFFFFF;
        }

        .whatsapp-btn:hover {
          background: #20BA5A;
        }

        .vip-support-card {
          border-color: #BBF7D0;
          background: #F0FDF4;
        }

        .vip-badge {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 800;
          color: #166534;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 6px;
        }

        /* Modal */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal-card {
          background: #FFFFFF;
          border-radius: 24px;
          max-width: 480px;
          width: 100%;
          padding: 30px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #64748B;
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group label {
          display: block;
          font-size: 0.85rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
        }

        .modal-input {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #CBD5E1;
          border-radius: 12px;
          font-size: 0.92rem;
          outline: none;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 10px;
        }

        .cancel-btn {
          flex: 1;
          padding: 12px;
          border: 1px solid #CBD5E1;
          background: #FFFFFF;
          border-radius: 9999px;
          font-weight: 700;
          cursor: pointer;
        }

        .confirm-btn {
          flex: 1;
          background: #0866FF;
          color: #FFFFFF;
        }

        .success-banner {
          background: #ECFDF5;
          color: #065F46;
          padding: 16px;
          border-radius: 12px;
          font-weight: 700;
          text-align: center;
        }
      `}</style>
    </ClientLayout>
  );
}
