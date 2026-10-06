'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function CustomerCareWidget() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'ticket'
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'Marhaban! I am your Al Mukammal Concierge & Delivery Assistant. How can I assist you today with your orders, laptops, or deliveries?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);

  // Formal Ticket Form State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('ORDER_TRACKING');
  const [ticketPriority, setTicketPriority] = useState('MEDIUM');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketOrderId, setTicketOrderId] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(null);
  const [ticketError, setTicketError] = useState('');

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputValue.trim();
    if (!textToSend || isTyping) return;

    const userMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInputValue('');
    setIsTyping(true);

    try {
      const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {})
        },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: messages.slice(-6).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        })
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        const botReply = {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: data.reply,
          toolData: data.toolData || null,
          suggestedActions: data.suggestedActions || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botReply]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: 'err-' + Date.now(),
            sender: 'bot',
            text: data.error || 'I encountered a brief connection issue. Please connect directly via our 24/7 Dubai WhatsApp specialist at +971 50 955 0121.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-net-' + Date.now(),
          sender: 'bot',
          text: 'Network temporarily unavailable. Our Dubai Deira Showroom team is directly reachable via WhatsApp: +971 50 955 0121.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      setTicketError('Please provide both a subject and details for your ticket.');
      return;
    }

    setTicketSubmitting(true);
    setTicketError('');

    try {
      const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {})
        },
        body: JSON.stringify({
          subject: ticketSubject.trim(),
          category: ticketCategory,
          priority: ticketPriority,
          message: ticketMessage.trim(),
          orderId: ticketOrderId.trim() || undefined
        })
      });

      const data = await res.json();

      if (res.ok && data.ticket) {
        setTicketSuccess(data.ticket);
        setTicketSubject('');
        setTicketMessage('');
        setTicketOrderId('');
      } else {
        setTicketError(data.error || 'Failed to submit ticket. Please try again.');
      }
    } catch {
      setTicketError('Network error occurred while submitting ticket.');
    } finally {
      setTicketSubmitting(false);
    }
  };

  const quickPrompts = [
    { label: '📦 Where is my order?', prompt: 'Where is my recent order and what is its live delivery status?' },
    { label: '🚚 When will it arrive?', prompt: 'When will my order arrive in UAE?' },
    { label: '🔄 Reschedule delivery', prompt: 'I want to reschedule my delivery date or time slot.' },
    { label: '🛡️ UAE Warranty Policy', prompt: 'What is your warranty and returns policy for laptops?' },
    { label: '📍 Dubai Showroom Pin', prompt: 'Where is your physical showroom in Dubai and what are the opening hours?' }
  ];

  return (
    <>
      {/* Floating Trigger Bubble Button */}
      <div className="care-widget-root">
        {!isOpen && (
          <button
            type="button"
            className="care-bubble-btn"
            onClick={() => setIsOpen(true)}
            aria-label="Open Al Mukammal Customer Concierge"
          >
            <div className="care-bubble-inner">
              <div className="care-avatar-ring">
                <span className="care-icon-robot">🤖</span>
                <span className="care-online-indicator" />
              </div>
              <div className="care-label-stack">
                <span className="care-label-title">Concierge &amp; Dispatch</span>
                <span className="care-label-sub">AI Support 24/7</span>
              </div>
            </div>
            {unreadCount > 0 && <span className="care-unread-chip">{unreadCount}</span>}
          </button>
        )}

        {/* Expanded Chat & Support Panel */}
        {isOpen && (
          <div className="care-drawer-modal" role="dialog" aria-label="Customer Care Concierge">
            {/* Header */}
            <div className="care-modal-header">
              <div className="care-header-info">
                <div className="care-header-avatar">
                  <span>💎</span>
                  <span className="care-status-dot-active" />
                </div>
                <div>
                  <h3 className="care-header-title">Al Mukammal Concierge</h3>
                  <p className="care-header-desc">AI Dispatch &amp; Hardware Support</p>
                </div>
              </div>
              <div className="care-header-controls">
                <a
                  href="https://wa.me/971509550121?text=Hello%20Al%20Mukammal%20Support,%20I%20need%20assistance"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="care-wa-quick-btn"
                  title="Direct WhatsApp"
                >
                  💬 VIP WhatsApp
                </a>
                <button
                  type="button"
                  className="care-close-btn"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close Concierge"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Sub-Tabs: AI Assistant vs Create Formal Ticket */}
            <div className="care-tab-bar">
              <button
                type="button"
                className={`care-tab-item ${activeTab === 'chat' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                🤖 AI Concierge
              </button>
              <button
                type="button"
                className={`care-tab-item ${activeTab === 'ticket' ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveTab('ticket');
                  setTicketSuccess(null);
                }}
              >
                🎫 Formal Ticket
              </button>
            </div>

            {/* TAB 1: AI Chat Assistant */}
            {activeTab === 'chat' && (
              <div className="care-chat-pane">
                {/* Messages Scroll Area */}
                <div className="care-messages-stream">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`care-msg-row ${m.sender === 'user' ? 'is-user' : 'is-bot'}`}
                    >
                      {m.sender === 'bot' && (
                        <div className="care-bot-avatar-mark">AM</div>
                      )}
                      <div className="care-bubble-container">
                        <div className="care-msg-bubble">
                          <p className="care-msg-text">{m.text}</p>

                          {/* Rich Order Tracking Tool Result Card */}
                          {m.toolData?.order && (
                            <div className="care-rich-order-card">
                              <div className="care-order-card-header">
                                <span className="care-order-number">
                                  #{m.toolData.order.orderNumber || m.toolData.order._id?.slice(-8)}
                                </span>
                                <span className="care-order-status-badge">
                                  {m.toolData.order.status?.toUpperCase()}
                                </span>
                              </div>
                              <div className="care-order-meta">
                                <div>Total: AED {m.toolData.order.totalAmount?.toLocaleString()}</div>
                                {m.toolData.order.trackingNumber && (
                                  <div className="care-tracking-ref">
                                    AWB: <strong>{m.toolData.order.trackingNumber}</strong>
                                  </div>
                                )}
                              </div>
                              {m.toolData.order.trackingNumber && (
                                <Link
                                  href={`/track/${m.toolData.order.trackingNumber}`}
                                  className="care-track-direct-btn"
                                  onClick={() => setIsOpen(false)}
                                >
                                  📍 View Live Radar Tracking →
                                </Link>
                              )}
                            </div>
                          )}

                          {/* Quick Suggested Buttons */}
                          {m.suggestedActions?.length > 0 && (
                            <div className="care-suggested-actions">
                              {m.suggestedActions.map((action, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className="care-action-pill"
                                  onClick={() => handleSendMessage(action.prompt || action.label)}
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="care-msg-time">{m.timestamp}</span>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="care-msg-row is-bot">
                      <div className="care-bot-avatar-mark">AM</div>
                      <div className="care-typing-indicator">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick Prompts Carousel */}
                <div className="care-quick-prompts-bar">
                  {quickPrompts.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="care-prompt-chip"
                      onClick={() => handleSendMessage(q.prompt)}
                      disabled={isTyping}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>

                {/* Input Controls */}
                <div className="care-input-bar">
                  <input
                    type="text"
                    className="care-text-input"
                    placeholder="Type tracking number or ask a question..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isTyping}
                  />
                  <button
                    type="button"
                    className="care-send-btn"
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isTyping}
                    aria-label="Send message"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Formal Support Ticket */}
            {activeTab === 'ticket' && (
              <div className="care-ticket-pane">
                {ticketSuccess ? (
                  <div className="care-ticket-success-box">
                    <div className="care-success-badge">✓</div>
                    <h4>Support Ticket Created</h4>
                    <p>
                      Ticket Ref: <strong>{ticketSuccess.ticketId}</strong>
                    </p>
                    <p className="care-success-sub">
                      Our Dubai operations desk has received your ticket and will respond within 2 to 4 business hours.
                    </p>
                    <button
                      type="button"
                      className="care-btn-outline"
                      onClick={() => {
                        setTicketSuccess(null);
                        setActiveTab('chat');
                      }}
                    >
                      Return to Chat Assistant
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleTicketSubmit} className="care-ticket-form">
                    <p className="care-ticket-intro">
                      Escalate an issue directly to Al Mukammal Operations &amp; Dispatch management.
                    </p>

                    {ticketError && <div className="care-ticket-err-banner">{ticketError}</div>}

                    <div className="care-field-group">
                      <label>Category</label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="care-select"
                      >
                        <option value="ORDER_TRACKING">Order Tracking / Delayed Delivery</option>
                        <option value="DELIVERY_FAILED">Failed Delivery / Driver Not Arrived</option>
                        <option value="PACKAGE_DAMAGED">Package Damaged in Transit</option>
                        <option value="RETURN">Hardware Return / Replacement</option>
                        <option value="REFUND">Refund Inquiry</option>
                        <option value="OTHER">Other Operational Request</option>
                      </select>
                    </div>

                    <div className="care-field-group">
                      <label>Order Number / AWB (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. AM-2026-XXXX or ORD-XXXX"
                        value={ticketOrderId}
                        onChange={(e) => setTicketOrderId(e.target.value)}
                        className="care-input"
                      />
                    </div>

                    <div className="care-field-group">
                      <label>Subject</label>
                      <input
                        type="text"
                        placeholder="Brief summary of your request"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        className="care-input"
                        required
                      />
                    </div>

                    <div className="care-field-group">
                      <label>Detailed Message</label>
                      <textarea
                        rows="3"
                        placeholder="Provide details about your delivery or hardware concern..."
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        className="care-textarea"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="care-submit-ticket-btn"
                      disabled={ticketSubmitting}
                    >
                      {ticketSubmitting ? 'Submitting to Dispatch...' : 'Submit Support Ticket'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        .care-widget-root {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          font-family: inherit;
        }

        .care-bubble-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px 8px 10px;
          background: #000000;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 999px;
          cursor: pointer;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
        }

        .care-bubble-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px -4px rgba(0, 0, 0, 0.5);
        }

        .care-bubble-inner {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .care-avatar-ring {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #1e293b;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          font-size: 18px;
        }

        .care-online-indicator {
          position: absolute;
          bottom: 1px;
          right: 1px;
          width: 9px;
          height: 9px;
          background: #10b981;
          border: 2px solid #000;
          border-radius: 50%;
        }

        .care-label-stack {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .care-label-title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: -0.2px;
        }

        .care-label-sub {
          font-size: 11px;
          color: #94a3b8;
        }

        .care-unread-chip {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #2563eb;
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          border-radius: 999px;
          padding: 2px 7px;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.6);
        }

        /* Expanded Modal */
        .care-drawer-modal {
          width: 400px;
          max-width: calc(100vw - 32px);
          height: 580px;
          max-height: calc(100vh - 80px);
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: careFadeUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes careFadeUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .care-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: #0f172a;
          color: #ffffff;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .care-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .care-header-avatar {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #1e293b;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          font-size: 18px;
        }

        .care-status-dot-active {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 9px;
          height: 9px;
          background: #10b981;
          border-radius: 50%;
          border: 2px solid #0f172a;
        }

        .care-header-title {
          font-size: 14px;
          font-weight: 700;
          margin: 0;
        }

        .care-header-desc {
          font-size: 11px;
          color: #94a3b8;
          margin: 2px 0 0;
        }

        .care-header-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .care-wa-quick-btn {
          font-size: 11px;
          font-weight: 600;
          color: #10b981;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 999px;
          padding: 4px 10px;
          text-decoration: none;
        }

        .care-close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 16px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .care-close-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }

        .care-tab-bar {
          display: flex;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .care-tab-item {
          flex: 1;
          padding: 10px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
        }

        .care-tab-item.is-active {
          color: #2563eb;
          border-bottom-color: #2563eb;
          background: #ffffff;
        }

        /* Chat Pane */
        .care-chat-pane {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #f8fafc;
        }

        .care-messages-stream {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .care-msg-row {
          display: flex;
          gap: 8px;
          max-width: 88%;
        }

        .care-msg-row.is-user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .care-msg-row.is-bot {
          align-self: flex-start;
        }

        .care-bot-avatar-mark {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #0f172a;
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .care-bubble-container {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .care-msg-bubble {
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 13px;
          line-height: 1.45;
          word-break: break-word;
        }

        .care-msg-row.is-user .care-msg-bubble {
          background: #2563eb;
          color: #ffffff;
          border-bottom-right-radius: 3px;
        }

        .care-msg-row.is-bot .care-msg-bubble {
          background: #ffffff;
          color: #1e293b;
          border: 1px solid #e2e8f0;
          border-bottom-left-radius: 3px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        }

        .care-msg-text {
          margin: 0;
          white-space: pre-wrap;
        }

        .care-msg-time {
          font-size: 10px;
          color: #94a3b8;
          padding: 0 4px;
        }

        .care-msg-row.is-user .care-msg-time {
          text-align: right;
        }

        /* Rich Order Card */
        .care-rich-order-card {
          margin-top: 10px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 10px;
        }

        .care-order-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .care-order-number {
          font-weight: 800;
          font-size: 12px;
          color: #0f172a;
        }

        .care-order-status-badge {
          background: #2563eb;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .care-order-meta {
          font-size: 12px;
          color: #475569;
          margin-bottom: 8px;
        }

        .care-track-direct-btn {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          color: #2563eb;
          text-decoration: underline;
        }

        /* Suggested Action Chips */
        .care-suggested-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }

        .care-action-pill {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .care-action-pill:hover {
          background: #dbeafe;
        }

        /* Typing Dots */
        .care-typing-indicator {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 8px 12px;
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .care-typing-indicator span {
          width: 6px;
          height: 6px;
          background: #94a3b8;
          border-radius: 50%;
          animation: careDotPulse 1.2s infinite ease-in-out;
        }

        .care-typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .care-typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes careDotPulse {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.4;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Quick Prompts Bar */
        .care-quick-prompts-bar {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding: 8px 14px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          scrollbar-width: none;
        }

        .care-quick-prompts-bar::-webkit-scrollbar {
          display: none;
        }

        .care-prompt-chip {
          white-space: nowrap;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #334155;
          font-size: 11px;
          font-weight: 600;
          border-radius: 999px;
          padding: 4px 10px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .care-prompt-chip:hover {
          background: #e2e8f0;
        }

        /* Input Bar */
        .care-input-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
        }

        .care-text-input {
          flex: 1;
          border: 1px solid #cbd5e1;
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 13px;
          outline: none;
        }

        .care-text-input:focus {
          border-color: #2563eb;
        }

        .care-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #2563eb;
          color: #ffffff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s;
        }

        .care-send-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }

        /* Ticket Form Pane */
        .care-ticket-pane {
          flex: 1;
          overflow-y: auto;
          padding: 18px;
          background: #ffffff;
        }

        .care-ticket-intro {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 14px;
        }

        .care-ticket-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .care-field-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .care-field-group label {
          font-size: 12px;
          font-weight: 600;
          color: #334155;
        }

        .care-select,
        .care-input,
        .care-textarea {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          font-family: inherit;
        }

        .care-select:focus,
        .care-input:focus,
        .care-textarea:focus {
          border-color: #2563eb;
        }

        .care-submit-ticket-btn {
          background: #0f172a;
          color: #ffffff;
          border: none;
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 6px;
        }

        .care-submit-ticket-btn:hover {
          background: #1e293b;
        }

        .care-ticket-err-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 12px;
        }

        .care-ticket-success-box {
          text-align: center;
          padding: 24px 12px;
        }

        .care-success-badge {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #dcfce7;
          color: #15803d;
          font-size: 20px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
        }

        .care-btn-outline {
          background: transparent;
          border: 1px solid #cbd5e1;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 14px;
        }
      `}</style>
    </>
  );
}
