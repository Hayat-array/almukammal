'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '../../ClientLayout';

export default function AdminLogisticsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [metrics, setMetrics] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [assignShipment, setAssignShipment] = useState(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [showDriverModal, setShowDriverModal] = useState(false);
  const [driverForm, setDriverForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicleType: 'VAN',
    vehiclePlate: ''
  });
  const [driverSaving, setDriverSaving] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/admin/login?redirect=/admin/logistics');
        return;
      }
      if (user.role !== 'admin' && user.role !== 'manager' && user.role !== 'operations') {
        router.push('/');
        return;
      }
      loadLogisticsOverview();
    }
  }, [user, authLoading]);

  const loadLogisticsOverview = async () => {
    try {
      setLoading(true);
      const currentToken = token || localStorage.getItem('token');
      const res = await fetch('/api/admin/logistics/overview', {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setShipments(data.recentShipments || []);
        setPartners(data.partners || []);
      }
    } catch (err) {
      console.error('Error loading logistics overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignShipment || !selectedPartnerId) return;
    setAssigning(true);

    try {
      const currentToken = token || localStorage.getItem('token');
      const res = await fetch(`/api/admin/shipments/${assignShipment.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({ partnerId: selectedPartnerId })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setAssignShipment(null);
        loadLogisticsOverview();
      } else {
        alert(data.error || 'Assignment failed');
      }
    } catch {
      alert('Network error during partner assignment');
    } finally {
      setAssigning(false);
    }
  };

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    setDriverSaving(true);

    try {
      const currentToken = token || localStorage.getItem('token');
      const res = await fetch('/api/admin/delivery-partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify(driverForm)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('✅ Driver partner provisioned successfully!');
        setShowDriverModal(false);
        setDriverForm({ name: '', email: '', phone: '', password: '', vehicleType: 'VAN', vehiclePlate: '' });
        loadLogisticsOverview();
      } else {
        alert(data.error || 'Failed to create partner');
      }
    } catch {
      alert('Network error provisioning driver');
    } finally {
      setDriverSaving(false);
    }
  };

  const filteredShipments = shipments.filter(s => {
    const matchesStatus = statusFilter === 'all' || s.status.toLowerCase() === statusFilter.toLowerCase();
    const q = search.toLowerCase().trim();
    if (!q) return matchesStatus;

    return matchesStatus && (
      s.trackingId.toLowerCase().includes(q) ||
      s.orderNumber.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.deliveryPartnerName && s.deliveryPartnerName.toLowerCase().includes(q))
    );
  });

  return (
    <ClientLayout>
      <div className="logistics-page-root">
        <div className="logistics-container">
          {/* Header */}
          <div className="page-header">
            <div>
              <div className="hub-tag">
                <span className="dot" />
                <span>Dubai Showroom Hub Dispatch</span>
              </div>
              <h1 className="page-title">Fleet Logistics Command Center</h1>
              <p className="page-subtitle">Real-time parcel dispatch, driver tracking, and delivery exception control</p>
            </div>

            <div className="header-actions">
              <button onClick={() => setShowDriverModal(true)} className="add-driver-btn">
                ➕ Add Delivery Partner
              </button>
              <Link href="/admin/orders" className="secondary-btn">
                View All Orders
              </Link>
            </div>
          </div>

          {/* Metric KPIs */}
          <div className="kpis-grid">
            <div className="kpi-card">
              <span className="kpi-label">Total Shipments</span>
              <span className="kpi-val">{metrics?.totalShipments || 0}</span>
              <span className="kpi-sub">Lifetime Manifests</span>
            </div>

            <div className="kpi-card highlight-kpi">
              <span className="kpi-label">Unassigned Hub Pickups</span>
              <span className="kpi-val">{metrics?.unassignedCount || 0}</span>
              <span className="kpi-sub">Awaiting Driver Select</span>
            </div>

            <div className="kpi-card active-kpi">
              <span className="kpi-label">Out for Delivery</span>
              <span className="kpi-val">{metrics?.outForDeliveryCount || 0}</span>
              <span className="kpi-sub">Active Final-Mile GPS</span>
            </div>

            <div className="kpi-card success-kpi">
              <span className="kpi-label">Fulfillment Success</span>
              <span className="kpi-val">{metrics?.successRate || 100}%</span>
              <span className="kpi-sub">{metrics?.deliveredCount || 0} Delivered</span>
            </div>
          </div>

          {/* Table & Controls Card */}
          <div className="table-card">
            <div className="table-toolbar">
              <div className="search-wrap">
                <input
                  type="text"
                  placeholder="Search Tracking ID, Order #, Customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="filters-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All States</option>
                  <option value="created">Created</option>
                  <option value="assignment_pending">Assignment Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="undelivered">Undelivered / Exception</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">Loading logistics records...</div>
            ) : filteredShipments.length === 0 ? (
              <div className="empty-state">No shipments match your criteria.</div>
            ) : (
              <div className="table-responsive">
                <table className="logistics-table">
                  <thead>
                    <tr>
                      <th>Tracking ID</th>
                      <th>Order #</th>
                      <th>Recipient</th>
                      <th>Sector / Area</th>
                      <th>Status</th>
                      <th>Driver Partner</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShipments.map(s => (
                      <tr key={s.id}>
                        <td>
                          <Link href={`/track/${s.trackingId}`} target="_blank" className="tracking-link">
                            {s.trackingId}
                          </Link>
                        </td>
                        <td>
                          <strong className="order-strong">#{s.orderNumber}</strong>
                        </td>
                        <td>{s.customerName}</td>
                        <td>{s.destinationArea ? `${s.destinationArea}, ` : ''}{s.destinationCity}</td>
                        <td>
                          <span className={`status-badge status-${s.status.toLowerCase()}`}>
                            {s.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          <span className={s.deliveryPartnerName === 'Unassigned' ? 'unassigned-driver' : 'assigned-driver'}>
                            {s.deliveryPartnerName}
                          </span>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button
                              onClick={() => {
                                setAssignShipment(s);
                                setSelectedPartnerId(partners[0]?.id || '');
                              }}
                              className="assign-action-btn"
                            >
                              Assign Driver
                            </button>
                            <Link href={`/track/${s.trackingId}`} target="_blank" className="track-mini-btn">
                              Live GPS ↗
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ASSIGN DRIVER MODAL */}
          {assignShipment && (
            <div className="modal-backdrop">
              <div className="modal-card">
                <div className="modal-header">
                  <h2>Assign Delivery Partner</h2>
                  <button onClick={() => setAssignShipment(null)} className="close-btn">✕</button>
                </div>

                <div className="modal-body">
                  <p>Assign driver for <strong>{assignShipment.trackingId}</strong> (Order #{assignShipment.orderNumber}) to delivery area <strong>{assignShipment.destinationArea}, {assignShipment.destinationCity}</strong>.</p>

                  <form onSubmit={handleAssignSubmit} className="modal-form">
                    <div className="form-group">
                      <label>Select Active Fleet Driver:</label>
                      <select
                        value={selectedPartnerId}
                        onChange={(e) => setSelectedPartnerId(e.target.value)}
                        className="modal-select"
                        required
                      >
                        {partners.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.code}) • {p.vehicleType} • {p.activeCount} Active Jobs
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="modal-actions">
                      <button type="button" onClick={() => setAssignShipment(null)} className="cancel-btn">
                        Cancel
                      </button>
                      <button type="submit" disabled={assigning || !selectedPartnerId} className="submit-btn">
                        {assigning ? 'Assigning...' : 'Confirm Assignment'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* CREATE DRIVER MODAL */}
          {showDriverModal && (
            <div className="modal-backdrop">
              <div className="modal-card">
                <div className="modal-header">
                  <h2>Provision New Delivery Partner</h2>
                  <button onClick={() => setShowDriverModal(false)} className="close-btn">✕</button>
                </div>

                <form onSubmit={handleCreateDriver} className="modal-form">
                  <div className="form-group">
                    <label>Full Name:</label>
                    <input
                      type="text"
                      placeholder="e.g. Tariq Mansoor"
                      value={driverForm.name}
                      onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                      required
                      className="modal-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address (For Portal Login):</label>
                    <input
                      type="email"
                      placeholder="driver@almukammal.ae"
                      value={driverForm.email}
                      onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                      required
                      className="modal-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>UAE Mobile Phone:</label>
                    <input
                      type="text"
                      placeholder="+971 50 123 4567"
                      value={driverForm.phone}
                      onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                      required
                      className="modal-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Initial Login Password:</label>
                    <input
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={driverForm.password}
                      onChange={(e) => setDriverForm({ ...driverForm, password: e.target.value })}
                      required
                      className="modal-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Vehicle Type:</label>
                    <select
                      value={driverForm.vehicleType}
                      onChange={(e) => setDriverForm({ ...driverForm, vehicleType: e.target.value })}
                      className="modal-select"
                    >
                      <option value="VAN">Delivery Van</option>
                      <option value="MOTORBIKE">Motorbike (Express)</option>
                      <option value="CAR">Car</option>
                    </select>
                  </div>

                  <div className="modal-actions">
                    <button type="button" onClick={() => setShowDriverModal(false)} className="cancel-btn">
                      Cancel
                    </button>
                    <button type="submit" disabled={driverSaving} className="submit-btn">
                      {driverSaving ? 'Registering...' : 'Register Driver'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .logistics-page-root {
          min-height: 90vh;
          background: #0B0F19;
          color: #E2E8F0;
          padding: 36px 20px 80px;
        }

        .logistics-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .hub-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          font-weight: 750;
          color: #38BDF8;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 6px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #38BDF8;
          box-shadow: 0 0 10px #38BDF8;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 32px;
        }

        .page-title {
          font-size: clamp(1.8rem, 3.5vw, 2.4rem);
          font-weight: 850;
          color: #FFFFFF;
          margin: 0 0 4px;
        }

        .page-subtitle {
          font-size: 0.95rem;
          color: #94A3B8;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .add-driver-btn {
          background: #0866FF;
          color: #FFFFFF;
          border: none;
          padding: 12px 22px;
          border-radius: 9999px;
          font-weight: 750;
          font-size: 0.92rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-driver-btn:hover {
          background: #0052CC;
          transform: translateY(-1px);
        }

        .secondary-btn {
          background: rgba(255, 255, 255, 0.08);
          color: #E2E8F0;
          text-decoration: none;
          padding: 12px 20px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 0.92rem;
          display: inline-flex;
          align-items: center;
        }

        .kpis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .kpi-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 24px;
        }

        .highlight-kpi { border-color: rgba(245, 158, 11, 0.3); }
        .active-kpi { border-color: rgba(56, 189, 248, 0.3); }
        .success-kpi { border-color: rgba(16, 185, 129, 0.3); }

        .kpi-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 750;
          text-transform: uppercase;
          color: #94A3B8;
          margin-bottom: 8px;
        }

        .kpi-val {
          font-size: 2.2rem;
          font-weight: 900;
          color: #FFFFFF;
          display: block;
          margin-bottom: 4px;
        }

        .kpi-sub {
          font-size: 0.8rem;
          color: #64748B;
        }

        .table-card {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 24px;
        }

        .table-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .search-input, .filter-select {
          background: #0B0F19;
          border: 1.5px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 10px 16px;
          color: #FFFFFF;
          font-size: 0.92rem;
          outline: none;
        }

        .search-input { min-width: 320px; }

        .table-responsive {
          overflow-x: auto;
        }

        .logistics-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
          text-align: left;
        }

        .logistics-table th {
          padding: 14px 16px;
          color: #94A3B8;
          font-weight: 750;
          text-transform: uppercase;
          font-size: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .logistics-table td {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #E2E8F0;
        }

        .tracking-link {
          color: #38BDF8;
          font-weight: 750;
          text-decoration: none;
        }

        .tracking-link:hover { text-decoration: underline; }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .status-created { background: rgba(148, 163, 184, 0.15); color: #CBD5E1; }
        .status-assigned { background: rgba(56, 189, 248, 0.15); color: #38BDF8; }
        .status-out_for_delivery { background: rgba(245, 158, 11, 0.2); color: #FBBF24; }
        .status-delivered { background: rgba(16, 185, 129, 0.2); color: #34D399; }
        .status-undelivered { background: rgba(239, 68, 68, 0.2); color: #F87171; }

        .unassigned-driver {
          color: #F87171;
          font-weight: 700;
        }

        .assigned-driver {
          color: #E2E8F0;
          font-weight: 600;
        }

        .actions-cell {
          display: flex;
          gap: 8px;
        }

        .assign-action-btn {
          background: #0866FF;
          color: #FFFFFF;
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 750;
          cursor: pointer;
        }

        .track-mini-btn {
          background: rgba(255, 255, 255, 0.08);
          color: #E2E8F0;
          text-decoration: none;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 700;
        }

        /* Modal */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
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
          max-width: 500px;
          width: 100%;
          padding: 30px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-header h2 {
          font-size: 1.3rem;
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

        .modal-input, .modal-select {
          width: 100%;
          background: #0B0F19;
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 12px;
          font-size: 0.95rem;
          color: #FFFFFF;
          outline: none;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 10px;
        }

        .cancel-btn, .submit-btn {
          flex: 1;
          padding: 12px;
          border-radius: 12px;
          font-weight: 750;
          cursor: pointer;
          border: none;
        }

        .cancel-btn {
          background: rgba(255, 255, 255, 0.1);
          color: #E2E8F0;
        }

        .submit-btn {
          background: #0866FF;
          color: #FFFFFF;
        }
      `}</style>
    </ClientLayout>
  );
}
