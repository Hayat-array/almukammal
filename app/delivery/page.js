'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '../ClientLayout';

export default function DeliveryPartnerDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [partner, setPartner] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter] = useState('active'); // 'active' | 'completed' | 'available'
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [syncing, setSyncing] = useState(false);

  // Modal states
  const [activeShipment, setActiveShipment] = useState(null);
  const [showPodModal, setShowPodModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);

  // Form states
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [podSubmitting, setPodSubmitting] = useState(false);

  const [exceptionReason, setExceptionReason] = useState('CUSTOMER_UNAVAILABLE');
  const [exceptionRemarks, setExceptionRemarks] = useState('');
  const [exceptionSubmitting, setExceptionSubmitting] = useState(false);

  // Watch network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOfflineMode(false);
      flushOfflineQueue();
    };
    const handleOffline = () => {
      setIsOfflineMode(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOfflineMode(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth check & load assignments
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/delivery/login');
        return;
      }
      if (user.role !== 'delivery_partner' && user.role !== 'admin') {
        router.push('/delivery/login');
        return;
      }
      loadAssignments();
    }
  }, [user, authLoading, filter]);

  // Periodic GPS location broadcaster when online
  useEffect(() => {
    if (!user || !isOnline || isOfflineMode) return;

    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude, accuracy, heading, speed } = pos.coords;
            // Send to current active delivery if any
            const activeOne = assignments.find(a => a.status === 'OUT_FOR_DELIVERY' || a.status === 'IN_TRANSIT');
            if (activeOne) {
              try {
                const currentToken = token || localStorage.getItem('token');
                await fetch(`/api/delivery/shipments/${activeOne._id}/location`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                  },
                  body: JSON.stringify({
                    lat: latitude,
                    lng: longitude,
                    accuracy,
                    heading,
                    speed
                  })
                });
              } catch {
                // Ignore transient network errors
              }
            }
          },
          () => {},
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
        );
      }
    }, 15000); // 15 seconds controlled interval

    return () => clearInterval(interval);
  }, [user, isOnline, isOfflineMode, assignments, token]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const currentToken = token || localStorage.getItem('token');
      const res = await fetch(`/api/delivery/assignments?filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
        if (data.partner) {
          setPartner(data.partner);
          setIsOnline(data.partner.isOnline);
        }
      }
    } catch {
      // Offline fallback: load cached assignments from localStorage
      const cached = localStorage.getItem(`cached_deliveries_${filter}`);
      if (cached) {
        setAssignments(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  };

  const flushOfflineQueue = async () => {
    const queue = JSON.parse(localStorage.getItem('delivery_offline_queue') || '[]');
    if (queue.length === 0) return;

    setSyncing(true);
    const remaining = [];
    const currentToken = token || localStorage.getItem('token');

    for (const action of queue) {
      try {
        await fetch(action.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`,
            'Idempotency-Key': action.idempotencyKey
          },
          body: JSON.stringify(action.payload)
        });
      } catch {
        remaining.push(action);
      }
    }

    localStorage.setItem('delivery_offline_queue', JSON.stringify(remaining));
    setPendingQueue(remaining);
    setSyncing(false);
    loadAssignments();
  };

  const enqueueAction = (url, payload) => {
    const idempotencyKey = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const action = { url, payload, idempotencyKey, timestamp: new Date() };
    const queue = JSON.parse(localStorage.getItem('delivery_offline_queue') || '[]');
    queue.push(action);
    localStorage.setItem('delivery_offline_queue', JSON.stringify(queue));
    setPendingQueue(queue);
    alert('Action queued offline. Will sync automatically upon connection.');
  };

  const handleStatusTransition = async (shipmentId, toStatus) => {
    if (isOfflineMode) {
      enqueueAction(`/api/delivery/shipments/${shipmentId}/transition`, { toStatus });
      setAssignments(prev => prev.map(a => a._id === shipmentId ? { ...a, status: toStatus } : a));
      return;
    }

    try {
      const currentToken = token || localStorage.getItem('token');
      const idempotencyKey = `trans_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const res = await fetch(`/api/delivery/shipments/${shipmentId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({ toStatus })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAssignments(prev => prev.map(a => a._id === shipmentId ? { ...a, status: toStatus } : a));
      } else {
        alert(data.error || 'Transition rejected');
      }
    } catch {
      enqueueAction(`/api/delivery/shipments/${shipmentId}/transition`, { toStatus });
    }
  };

  const handlePodSubmit = async (e) => {
    e.preventDefault();
    if (!activeShipment) return;
    setPodSubmitting(true);

    try {
      const currentToken = token || localStorage.getItem('token');
      const idempotencyKey = `pod_${activeShipment._id}_${Date.now()}`;

      const res = await fetch(`/api/delivery/shipments/${activeShipment._id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          deliveryOtp: deliveryOtp.trim(),
          receivedBy: receivedBy.trim() || 'Customer in person'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('✅ Delivery successfully verified and completed!');
        setShowPodModal(false);
        setDeliveryOtp('');
        setReceivedBy('');
        loadAssignments();
      } else {
        alert(`❌ ${data.error || 'Verification failed'}`);
      }
    } catch {
      enqueueAction(`/api/delivery/shipments/${activeShipment._id}/complete`, {
        deliveryOtp: deliveryOtp.trim(),
        receivedBy: receivedBy.trim() || 'Customer in person'
      });
      setShowPodModal(false);
    } finally {
      setPodSubmitting(false);
    }
  };

  const handleExceptionSubmit = async (e) => {
    e.preventDefault();
    if (!activeShipment) return;
    setExceptionSubmitting(true);

    try {
      const currentToken = token || localStorage.getItem('token');
      const res = await fetch(`/api/delivery/shipments/${activeShipment._id}/exception`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          reason: exceptionReason,
          remarks: exceptionRemarks.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`⚠️ Exception recorded: ${data.message}`);
        setShowExceptionModal(false);
        setExceptionRemarks('');
        loadAssignments();
      } else {
        alert(data.error || 'Failed to record exception');
      }
    } catch {
      enqueueAction(`/api/delivery/shipments/${activeShipment._id}/exception`, {
        reason: exceptionReason,
        remarks: exceptionRemarks.trim()
      });
      setShowExceptionModal(false);
    } finally {
      setExceptionSubmitting(false);
    }
  };

  return (
    <ClientLayout>
      <div className="delivery-app-root">
        <div className="delivery-container">
          {/* OFFLINE RESILIENCE BANNER */}
          {isOfflineMode && (
            <div className="offline-banner">
              <span>⚠️ Offline Mode Active. Updates are saved locally and will auto-sync.</span>
            </div>
          )}

          {syncing && (
            <div className="sync-banner">
              <span>🔄 Syncing offline updates with Al Mukammal servers...</span>
            </div>
          )}

          {/* TOP DRIVER HEADER */}
          <div className="driver-header-card">
            <div className="driver-profile">
              <div className="driver-avatar">🚐</div>
              <div>
                <span className="driver-badge">Al Mukammal Fleet Driver</span>
                <h1 className="driver-name">{partner?.name || user?.name || 'Courier Partner'}</h1>
                <span className="driver-code">{partner?.code || 'DRV-DXB-01'} • Dubai Metro Fleet</span>
              </div>
            </div>

            <div className="online-toggle-wrap">
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`duty-btn ${isOnline ? 'duty-online' : 'duty-offline'}`}
              >
                <span className="duty-dot" />
                <span>{isOnline ? 'Online / On Duty' : 'Offline / Off Duty'}</span>
              </button>
            </div>
          </div>

          {/* QUICK METRICS */}
          <div className="driver-metrics">
            <div className="metric-box">
              <span className="m-label">Active Assigned</span>
              <span className="m-val">{assignments.filter(a => a.status !== 'DELIVERED').length}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">Completed Today</span>
              <span className="m-val highlight">{partner?.completedCount || 0}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">Fleet Rating</span>
              <span className="m-val">⭐ {partner?.rating || '5.0'}</span>
            </div>
          </div>

          {/* TABS */}
          <div className="tabs-bar">
            <button
              onClick={() => setFilter('active')}
              className={`tab-btn ${filter === 'active' ? 'active' : ''}`}
            >
              Active Deliveries
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`tab-btn ${filter === 'completed' ? 'active' : ''}`}
            >
              Completed Today
            </button>
          </div>

          {/* ASSIGNMENTS LIST */}
          {loading ? (
            <div className="loading-card">
              <p>Loading assigned deliveries...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="empty-card">
              <div className="empty-icon">📦</div>
              <h3>No {filter} deliveries right now</h3>
              <p>New orders dispatched from the Deira hub will appear here automatically.</p>
            </div>
          ) : (
            <div className="shipments-list">
              {assignments.map(shipment => (
                <div key={shipment._id} className="shipment-job-card">
                  <div className="job-top">
                    <div>
                      <span className="tracking-chip">{shipment.trackingId}</span>
                      <h3 className="customer-name">{shipment.customerName}</h3>
                      <span className="order-chip">Order #{shipment.orderNumber}</span>
                    </div>

                    <div className="status-tag">
                      {shipment.status.replace(/_/g, ' ')}
                    </div>
                  </div>

                  {/* Address & Navigation */}
                  <div className="job-address-box">
                    <span className="address-label">📍 Delivery Address:</span>
                    <p className="address-text">{shipment.address}, {shipment.city}</p>
                    {shipment.notes && (
                      <p className="address-notes"><strong>Notes:</strong> {shipment.notes}</p>
                    )}
                  </div>

                  {/* Items & Payment */}
                  <div className="job-meta-row">
                    <span className="meta-items">💼 {shipment.itemsCount} Package(s)</span>
                    <span className="meta-total">Total: AED {Number(shipment.totalAmount || 0).toLocaleString()}</span>
                  </div>

                  {/* ACTION CONTROLS */}
                  <div className="job-actions-grid">
                    {/* Call Customer */}
                    <a href={`tel:${shipment.customerPhone}`} className="action-btn call-action">
                      📞 Call Customer
                    </a>

                    {/* Google Maps Navigation */}
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(`${shipment.address}, ${shipment.city}, UAE`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-btn nav-action"
                    >
                      🧭 Open GPS Maps
                    </a>

                    {/* Stage Transition Buttons */}
                    {shipment.status === 'ASSIGNED' && (
                      <button
                        onClick={() => handleStatusTransition(shipment._id, 'PICKED_UP')}
                        className="action-btn primary-action"
                      >
                        📦 Confirm Pickup from Hub
                      </button>
                    )}

                    {shipment.status === 'PICKED_UP' && (
                      <button
                        onClick={() => handleStatusTransition(shipment._id, 'OUT_FOR_DELIVERY')}
                        className="action-btn primary-action"
                      >
                        🚀 Start Delivery (Out for Delivery)
                      </button>
                    )}

                    {shipment.status === 'OUT_FOR_DELIVERY' && (
                      <>
                        <button
                          onClick={() => handleStatusTransition(shipment._id, 'ARRIVED_AT_DESTINATION')}
                          className="action-btn primary-action"
                        >
                          🏢 Arrived at Building
                        </button>

                        <button
                          onClick={() => {
                            setActiveShipment(shipment);
                            setShowPodModal(true);
                          }}
                          className="action-btn success-action"
                        >
                          ✅ Complete Delivery (Enter OTP)
                        </button>

                        <button
                          onClick={() => {
                            setActiveShipment(shipment);
                            setShowExceptionModal(true);
                          }}
                          className="action-btn warning-action"
                        >
                          ⚠️ Report Issue / Undelivered
                        </button>
                      </>
                    )}

                    {shipment.status === 'ARRIVED_AT_DESTINATION' && (
                      <>
                        <button
                          onClick={() => {
                            setActiveShipment(shipment);
                            setShowPodModal(true);
                          }}
                          className="action-btn success-action"
                        >
                          ✅ Verify Customer OTP & Handover
                        </button>

                        <button
                          onClick={() => {
                            setActiveShipment(shipment);
                            setShowExceptionModal(true);
                          }}
                          className="action-btn warning-action"
                        >
                          ⚠️ Customer Unavailable / Exception
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PROOF OF DELIVERY MODAL */}
          {showPodModal && activeShipment && (
            <div className="modal-backdrop">
              <div className="modal-card">
                <div className="modal-header">
                  <h2>Verify Proof of Delivery</h2>
                  <button onClick={() => setShowPodModal(false)} className="close-btn">✕</button>
                </div>

                <p className="pod-instructions">
                  Ask the customer for the <strong>6-digit Delivery Verification Code</strong> sent to their email/account.
                </p>

                <form onSubmit={handlePodSubmit} className="modal-form">
                  <div className="form-group">
                    <label>Customer 6-Digit Delivery OTP:</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 492019"
                      value={deliveryOtp}
                      onChange={(e) => setDeliveryOtp(e.target.value.replace(/\D/g, ''))}
                      className="otp-modal-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Received By (Name / Relation):</label>
                    <input
                      type="text"
                      placeholder="e.g. Customer in person / Office security"
                      value={receivedBy}
                      onChange={(e) => setReceivedBy(e.target.value)}
                      className="modal-input"
                    />
                  </div>

                  <div className="modal-actions">
                    <button type="button" onClick={() => setShowPodModal(false)} className="cancel-btn">
                      Cancel
                    </button>
                    <button type="submit" disabled={podSubmitting || deliveryOtp.length !== 6} className="confirm-btn">
                      {podSubmitting ? 'Verifying...' : 'Verify OTP & Mark Delivered'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EXCEPTION / UNDELIVERED MODAL */}
          {showExceptionModal && activeShipment && (
            <div className="modal-backdrop">
              <div className="modal-card">
                <div className="modal-header">
                  <h2>Report Delivery Exception</h2>
                  <button onClick={() => setShowExceptionModal(false)} className="close-btn">✕</button>
                </div>

                <form onSubmit={handleExceptionSubmit} className="modal-form">
                  <div className="form-group">
                    <label>Reason for Failed Attempt:</label>
                    <select
                      value={exceptionReason}
                      onChange={(e) => setExceptionReason(e.target.value)}
                      className="modal-input"
                    >
                      <option value="CUSTOMER_UNAVAILABLE">Customer Unavailable / Did not answer phone</option>
                      <option value="PHONE_UNREACHABLE">Phone Switched Off / Unreachable</option>
                      <option value="WRONG_ADDRESS">Wrong Address / Incomplete Building Name</option>
                      <option value="CUSTOMER_REQUESTED_RESCHEDULE">Customer Requested Reschedule</option>
                      <option value="DELIVERY_REFUSED">Customer Refused Delivery</option>
                      <option value="WEATHER_OR_OPERATIONAL_DELAY">Weather / Heavy Traffic Delay</option>
                      <option value="OTHER">Other Reason</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Driver Remarks / Explanation:</label>
                    <textarea
                      rows={3}
                      placeholder="Describe what occurred (e.g. Called twice, waited 10 mins at gate)"
                      value={exceptionRemarks}
                      onChange={(e) => setExceptionRemarks(e.target.value)}
                      className="modal-input"
                      required
                    />
                  </div>

                  <div className="modal-actions">
                    <button type="button" onClick={() => setShowExceptionModal(false)} className="cancel-btn">
                      Cancel
                    </button>
                    <button type="submit" disabled={exceptionSubmitting} className="confirm-btn danger-btn">
                      {exceptionSubmitting ? 'Logging...' : 'Log Failed Attempt'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .delivery-app-root {
          min-height: 95vh;
          background: #0B0B0D;
          color: #E2E8F0;
          padding: 24px 16px 80px;
        }

        .delivery-container {
          max-width: 720px;
          margin: 0 auto;
        }

        .offline-banner {
          background: #EF4444;
          color: #FFFFFF;
          padding: 12px 16px;
          border-radius: 12px;
          font-weight: 750;
          font-size: 0.88rem;
          margin-bottom: 16px;
          text-align: center;
        }

        .sync-banner {
          background: #3B82F6;
          color: #FFFFFF;
          padding: 10px 16px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.85rem;
          margin-bottom: 16px;
          text-align: center;
        }

        .driver-header-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
        }

        .driver-profile {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .driver-avatar {
          font-size: 2.2rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 10px;
          border-radius: 18px;
        }

        .driver-badge {
          font-size: 0.72rem;
          color: #38BDF8;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 800;
        }

        .driver-name {
          font-size: 1.35rem;
          font-weight: 850;
          color: #FFFFFF;
          margin: 2px 0;
        }

        .driver-code {
          font-size: 0.82rem;
          color: #94A3B8;
        }

        .duty-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 800;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .duty-online {
          background: rgba(16, 185, 129, 0.15);
          color: #34D399;
          border: 1px solid #10B981;
        }

        .duty-offline {
          background: rgba(239, 68, 68, 0.15);
          color: #F87171;
          border: 1px solid #EF4444;
        }

        .duty-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .driver-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .metric-box {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 16px;
          text-align: center;
        }

        .m-label {
          display: block;
          font-size: 0.72rem;
          color: #94A3B8;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .m-val {
          font-size: 1.4rem;
          font-weight: 850;
          color: #FFFFFF;
        }

        .m-val.highlight {
          color: #34D399;
        }

        .tabs-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .tab-btn {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          color: #94A3B8;
          border: 1px solid transparent;
          padding: 12px;
          border-radius: 14px;
          font-weight: 750;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .tab-btn.active {
          background: #0866FF;
          color: #FFFFFF;
          border-color: #3B82F6;
        }

        .shipment-job-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 22px;
          padding: 22px;
          margin-bottom: 18px;
        }

        .job-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 14px;
        }

        .tracking-chip {
          display: inline-block;
          font-size: 0.75rem;
          color: #38BDF8;
          font-weight: 750;
          margin-bottom: 2px;
        }

        .customer-name {
          font-size: 1.25rem;
          font-weight: 850;
          color: #FFFFFF;
          margin: 0 0 2px;
        }

        .order-chip {
          font-size: 0.8rem;
          color: #94A3B8;
        }

        .status-tag {
          background: rgba(8, 102, 255, 0.2);
          border: 1px solid #3B82F6;
          color: #93C5FD;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .job-address-box {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 14px;
        }

        .address-label {
          font-size: 0.72rem;
          color: #94A3B8;
          text-transform: uppercase;
          font-weight: 750;
          display: block;
          margin-bottom: 4px;
        }

        .address-text {
          font-size: 0.95rem;
          color: #F8FAFC;
          font-weight: 650;
          margin: 0;
        }

        .address-notes {
          font-size: 0.82rem;
          color: #FBBF24;
          margin: 6px 0 0;
        }

        .job-meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.88rem;
          color: #94A3B8;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 14px;
        }

        .meta-total {
          font-weight: 750;
          color: #34D399;
        }

        .job-actions-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .action-btn {
          width: 100%;
          padding: 13px 18px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 0.92rem;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          border: none;
          display: block;
          transition: all 0.15s;
        }

        .call-action {
          background: #1E293B;
          color: #F8FAFC;
        }

        .nav-action {
          background: #0284C7;
          color: #FFFFFF;
        }

        .primary-action {
          background: #0866FF;
          color: #FFFFFF;
        }

        .success-action {
          background: #10B981;
          color: #FFFFFF;
        }

        .warning-action {
          background: rgba(239, 68, 68, 0.15);
          color: #F87171;
          border: 1px solid #EF4444;
        }

        /* Modal */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(5px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 24px;
          max-width: 440px;
          width: 100%;
          padding: 28px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .modal-header h2 {
          font-size: 1.25rem;
          font-weight: 850;
          color: #FFFFFF;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          color: #94A3B8;
          font-size: 1.2rem;
          cursor: pointer;
        }

        .pod-instructions {
          font-size: 0.88rem;
          color: #94A3B8;
          line-height: 1.5;
          margin-bottom: 20px;
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group label {
          display: block;
          font-size: 0.8rem;
          font-weight: 750;
          color: #94A3B8;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .otp-modal-input {
          width: 100%;
          background: #0B0B0D;
          border: 2px solid #3B82F6;
          border-radius: 14px;
          padding: 16px;
          font-size: 1.8rem;
          font-weight: 850;
          letter-spacing: 0.25em;
          text-align: center;
          color: #FFFFFF;
          outline: none;
        }

        .modal-input {
          width: 100%;
          background: #0B0B0D;
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 12px;
          font-size: 0.95rem;
          color: #FFFFFF;
          outline: none;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .cancel-btn, .confirm-btn {
          flex: 1;
          padding: 14px;
          border-radius: 14px;
          font-weight: 800;
          cursor: pointer;
          border: none;
        }

        .cancel-btn {
          background: rgba(255, 255, 255, 0.1);
          color: #E2E8F0;
        }

        .confirm-btn {
          background: #10B981;
          color: #FFFFFF;
        }

        .danger-btn {
          background: #EF4444;
        }
      `}</style>
    </ClientLayout>
  );
}
