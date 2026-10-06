'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

// Helper to parse markdown links, code, and bold text cleanly into JSX
function renderFormattedMessage(text) {
  if (!text) return null;
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    // Regex matching [label](url), **bold**, `code`
    const regex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g;
    const parts = line.split(regex);

    return (
      <React.Fragment key={lineIdx}>
        {parts.map((part, partIdx) => {
          if (!part) return null;

          // Check for link [label](url)
          const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (linkMatch) {
            const [, label, url] = linkMatch;
            const isInternal = url.startsWith('/');
            if (isInternal) {
              return (
                <Link key={partIdx} href={url} className="care-inline-link">
                  {label}
                </Link>
              );
            }
            return (
              <a
                key={partIdx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="care-inline-link"
              >
                {label}
              </a>
            );
          }

          // Check for bold **text**
          const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
          if (boldMatch) {
            return <strong key={partIdx}>{boldMatch[1]}</strong>;
          }

          // Check for inline code `code`
          const codeMatch = part.match(/^`([^`]+)`$/);
          if (codeMatch) {
            return (
              <code key={partIdx} className="care-inline-code">
                {codeMatch[1]}
              </code>
            );
          }

          return <span key={partIdx}>{part}</span>;
        })}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

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
  const [isMinimized, setIsMinimized] = useState(false);

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
      {/* Floating Concierge AI Trigger */}
      <div className={`care-widget-root ${isMinimized ? 'is-docked' : ''}`}>
        {!isOpen && (
          <>
            {isMinimized ? (
              <button
                type="button"
                className="care-edge-dock-btn"
                onClick={() => {
                  setIsMinimized(false);
                }}
                aria-label="Show AI Concierge Support"
                title="Tap to show AI Concierge"
              >
                <span className="care-dock-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="4" />
                    <circle cx="9" cy="16" r="1.5" fill="#38BDF8" />
                    <circle cx="15" cy="16" r="1.5" fill="#38BDF8" />
                    <path d="M12 2v4M8 2h8" />
                  </svg>
                </span>
                <span className="care-dock-dot" />
              </button>
            ) : (
              <div className="care-fab-container">
                <button
                  type="button"
                  className="care-fab-btn"
                  onClick={() => setIsOpen(true)}
                  aria-label="Open Al Mukammal AI Concierge"
                  title="Al Mukammal AI Concierge • 24/7 Dubai Support"
                >
                  <div className="care-fab-icon-wrap">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="10" rx="4" />
                      <circle cx="9" cy="16" r="1.5" fill="#38BDF8" />
                      <circle cx="15" cy="16" r="1.5" fill="#38BDF8" />
                      <path d="M12 2v4M8 2h8" />
                    </svg>
                    <span className="care-online-dot-pulse" />
                  </div>
                  {unreadCount > 0 && <span className="care-fab-badge">{unreadCount}</span>}
                </button>

                <button
                  type="button"
                  className="care-fab-close-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(true);
                  }}
                  aria-label="Hide AI bot button"
                  title="Hide AI bot (dock to edge)"
                >
                  ✕
                </button>
              </div>
            )}
          </>
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
                          <div className="care-msg-text">
                            {renderFormattedMessage(m.text)}
                          </div>

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

        .care-widget-root.is-docked {
          right: 0;
          bottom: auto;
          top: 62%;
          transform: translateY(-50%);
        }

        .care-fab-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .care-fab-btn {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0F172A 0%, #020617 100%);
          border: 1.5px solid rgba(8, 102, 255, 0.45);
          color: #38BDF8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 10px 28px -4px rgba(0, 0, 0, 0.6), 0 0 18px rgba(8, 102, 255, 0.35);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s, border-color 0.2s;
          position: relative;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .care-fab-btn:hover {
          transform: scale(1.08) translateY(-2px);
          border-color: #0866FF;
          box-shadow: 0 14px 36px -4px rgba(0, 0, 0, 0.7), 0 0 24px rgba(8, 102, 255, 0.55);
        }

        .care-fab-btn:active {
          transform: scale(0.96);
        }

        .care-fab-icon-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .care-online-dot-pulse {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: #10B981;
          border: 2px solid #020617;
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.8);
        }

        .care-fab-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          min-width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: #0866FF;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #020617;
          box-shadow: 0 2px 6px rgba(8, 102, 255, 0.6);
        }

        .care-fab-close-toggle {
          position: absolute;
          top: -4px;
          left: -4px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(30, 41, 59, 0.95);
          color: #94A3B8;
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0.75;
          transition: all 0.15s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
          z-index: 3;
        }

        .care-fab-close-toggle:hover {
          opacity: 1;
          background: #EF4444;
          color: #FFFFFF;
          border-color: #EF4444;
          transform: scale(1.15);
        }

        /* Docked Edge Launcher */
        .care-edge-dock-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 40px;
          padding: 0;
          border-radius: 12px 0 0 12px;
          background: rgba(15, 23, 42, 0.88);
          border: 1.5px solid rgba(8, 102, 255, 0.45);
          border-right: none;
          color: #38BDF8;
          cursor: pointer;
          box-shadow: -4px 6px 18px rgba(0, 0, 0, 0.45);
          transition: transform 0.2s, background 0.2s, opacity 0.2s;
          position: relative;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .care-edge-dock-btn:hover {
          transform: translateX(-4px);
          background: rgba(15, 23, 42, 1);
          border-color: #0866FF;
          color: #60A5FA;
        }

        .care-dock-dot {
          position: absolute;
          top: 7px;
          right: 7px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 4px #10B981;
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
          background: #0B0F19 !important;
          color: #FFFFFF !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
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
          background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          font-size: 18px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .care-status-dot-active {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 9px;
          height: 9px;
          background: #10B981;
          border-radius: 50%;
          border: 2px solid #0B0F19;
          box-shadow: 0 0 6px #10B981;
        }

        .care-header-title {
          font-size: 14.5px !important;
          font-weight: 700 !important;
          margin: 0 !important;
          color: #FFFFFF !important;
          letter-spacing: -0.2px !important;
          line-height: 1.25 !important;
        }

        .care-header-desc {
          font-size: 11px !important;
          color: #94A3B8 !important;
          margin: 2px 0 0 !important;
          line-height: 1.2 !important;
        }

        .care-header-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .care-wa-quick-btn {
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #FFFFFF !important;
          background: #25D366 !important;
          border: 1px solid rgba(255, 255, 255, 0.25) !important;
          border-radius: 999px !important;
          padding: 5px 12px !important;
          text-decoration: none !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 4px !important;
          box-shadow: 0 2px 8px rgba(37, 211, 102, 0.4) !important;
          transition: transform 0.15s ease, box-shadow 0.15s ease !important;
        }

        .care-wa-quick-btn:hover {
          transform: scale(1.05) !important;
          background: #22C55E !important;
          color: #FFFFFF !important;
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.55) !important;
        }

        .care-close-btn {
          background: rgba(255, 255, 255, 0.08) !important;
          border: 1px solid rgba(255, 255, 255, 0.14) !important;
          color: #E2E8F0 !important;
          font-size: 13px !important;
          cursor: pointer !important;
          width: 28px !important;
          height: 28px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 8px !important;
          transition: all 0.15s ease !important;
        }

        .care-close-btn:hover {
          color: #FFFFFF !important;
          background: rgba(239, 68, 68, 0.85) !important;
          border-color: rgba(239, 68, 68, 0.85) !important;
          transform: scale(1.06);
        }

        /* Segmented Pill Tab Bar */
        .care-tab-bar {
          display: flex;
          background: #F1F5F9;
          padding: 6px 12px;
          gap: 8px;
          border-bottom: 1px solid #E2E8F0;
        }

        .care-tab-item {
          flex: 1;
          padding: 8px 12px;
          font-size: 12.5px;
          font-weight: 600;
          color: #64748B;
          background: transparent;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .care-tab-item:hover {
          color: #0F172A;
          background: rgba(255, 255, 255, 0.5);
        }

        .care-tab-item.is-active {
          color: #0866FF !important;
          background: #FFFFFF !important;
          font-weight: 700 !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04) !important;
        }

        /* Chat Pane */
        .care-chat-pane {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #F8FAFC;
        }

        .care-messages-stream {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .care-msg-row {
          display: flex;
          gap: 8px;
          max-width: 86%;
        }

        .care-msg-row.is-user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .care-msg-row.is-bot {
          align-self: flex-start;
        }

        .care-bot-avatar-mark {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0B0F19 0%, #1E293B 100%);
          color: #38BDF8;
          border: 1px solid rgba(56, 189, 248, 0.25);
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .care-bubble-container {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .care-msg-bubble {
          padding: 11px 15px;
          font-size: 13.5px;
          line-height: 1.5;
          word-break: break-word;
        }

        /* User Message Bubble: Rich Electric Blue Gradient + High Contrast Pure White Text */
        .care-msg-row.is-user .care-msg-bubble {
          background: linear-gradient(135deg, #0866FF 0%, #0052CC 100%) !important;
          color: #FFFFFF !important;
          border-radius: 18px 18px 4px 18px !important;
          box-shadow: 0 4px 14px rgba(8, 102, 255, 0.28) !important;
          border: none !important;
        }

        .care-msg-row.is-user .care-msg-bubble * {
          color: #FFFFFF !important;
        }

        .care-msg-row.is-user .care-msg-text {
          color: #FFFFFF !important;
          font-weight: 500 !important;
          font-size: 13.5px !important;
          line-height: 1.5 !important;
        }

        /* Bot Message Bubble: Premium Crisp White Card + High Contrast Slate-900 Text */
        .care-msg-row.is-bot .care-msg-bubble {
          background: #FFFFFF !important;
          color: #0F172A !important;
          border: 1px solid #E2E8F0 !important;
          border-radius: 18px 18px 18px 4px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
        }

        .care-msg-row.is-bot .care-msg-text {
          color: #0F172A !important;
          font-size: 13.5px !important;
          line-height: 1.55 !important;
        }

        .care-msg-row.is-bot .care-msg-text * {
          color: #0F172A;
        }

        .care-inline-link {
          color: #0866FF !important;
          font-weight: 700 !important;
          text-decoration: underline !important;
          text-underline-offset: 2.5px !important;
          word-break: break-all;
          transition: color 0.15s ease;
        }

        .care-inline-link:hover {
          color: #0043A8 !important;
          text-decoration-thickness: 2px !important;
        }

        .care-inline-code {
          background: #F1F5F9;
          color: #0F172A !important;
          padding: 2px 6px;
          border-radius: 5px;
          font-size: 12px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          border: 1px solid #E2E8F0;
          display: inline-block;
          vertical-align: baseline;
        }

        .care-msg-time {
          font-size: 10px;
          color: #94A3B8;
          padding: 0 4px;
        }

        .care-msg-row.is-user .care-msg-time {
          text-align: right;
        }

        /* Rich Order Card */
        .care-rich-order-card {
          margin-top: 10px;
          background: #F8FAFC;
          border: 1px solid #CBD5E1;
          border-radius: 12px;
          padding: 12px;
        }

        .care-order-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .care-order-number {
          font-weight: 800;
          font-size: 12.5px;
          color: #0F172A;
        }

        .care-order-status-badge {
          background: #0866FF;
          color: #FFFFFF;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .care-order-meta {
          font-size: 12px;
          color: #475569;
          margin-bottom: 8px;
        }

        .care-tracking-ref {
          margin-top: 3px;
        }

        .care-tracking-ref strong {
          color: #0F172A;
        }

        .care-track-direct-btn {
          display: inline-block;
          font-size: 11.5px;
          font-weight: 700;
          color: #0866FF;
          text-decoration: underline;
        }

        /* Suggested Action Chips */
        .care-suggested-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
        }

        .care-action-pill {
          background: #EFF6FF;
          color: #0866FF;
          border: 1px solid #BFDBFE;
          border-radius: 999px;
          padding: 5px 12px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .care-action-pill:hover {
          background: #DBEAFE;
          transform: translateY(-1px);
        }

        /* Typing Dots */
        .care-typing-indicator {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 10px 14px;
          display: flex;
          gap: 5px;
          align-items: center;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .care-typing-indicator span {
          width: 6px;
          height: 6px;
          background: #0866FF;
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
            opacity: 0.35;
          }
          40% {
            transform: scale(1.1);
            opacity: 1;
          }
        }

        /* Quick Prompts Bar */
        .care-quick-prompts-bar {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 10px 14px;
          background: #F8FAFC;
          border-top: 1px solid #E2E8F0;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .care-quick-prompts-bar::-webkit-scrollbar {
          display: none;
        }

        .care-prompt-chip {
          white-space: nowrap;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          color: #0F172A;
          font-size: 11.5px;
          font-weight: 600;
          border-radius: 999px;
          padding: 6px 13px;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .care-prompt-chip:hover {
          background: #EFF6FF;
          border-color: #0866FF;
          color: #0866FF;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(8, 102, 255, 0.12);
        }

        /* Input Bar */
        .care-input-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: #FFFFFF;
          border-top: 1px solid #E2E8F0;
        }

        .care-text-input {
          flex: 1;
          border: 1.5px solid #CBD5E1;
          background: #F8FAFC;
          color: #0F172A;
          border-radius: 999px;
          padding: 10px 16px;
          font-size: 13.5px;
          outline: none;
          transition: all 0.2s ease;
        }

        .care-text-input::placeholder {
          color: #94A3B8;
          font-size: 13px;
        }

        .care-text-input:focus {
          background: #FFFFFF;
          border-color: #0866FF;
          box-shadow: 0 0 0 3.5px rgba(8, 102, 255, 0.12);
        }

        .care-send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0866FF 0%, #0052CC 100%);
          color: #FFFFFF;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(8, 102, 255, 0.35);
          transition: all 0.15s ease;
        }

        .care-send-btn:hover:not(:disabled) {
          transform: scale(1.06);
          box-shadow: 0 4px 14px rgba(8, 102, 255, 0.5);
        }

        .care-send-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .care-send-btn:disabled {
          background: #E2E8F0;
          color: #94A3B8;
          box-shadow: none;
          cursor: not-allowed;
        }

        /* Ticket Form Pane */
        .care-ticket-pane {
          flex: 1;
          overflow-y: auto;
          padding: 18px;
          background: #FFFFFF;
        }

        .care-ticket-intro {
          font-size: 12.5px;
          color: #64748B;
          margin-bottom: 14px;
          line-height: 1.5;
        }

        .care-ticket-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .care-field-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .care-field-group label {
          font-size: 12px;
          font-weight: 700;
          color: #0F172A;
        }

        .care-select,
        .care-input,
        .care-textarea {
          width: 100%;
          padding: 9px 12px;
          border: 1.5px solid #CBD5E1;
          background: #F8FAFC;
          color: #0F172A;
          border-radius: 10px;
          font-size: 13px;
          outline: none;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .care-select:focus,
        .care-input:focus,
        .care-textarea:focus {
          background: #FFFFFF;
          border-color: #0866FF;
          box-shadow: 0 0 0 3px rgba(8, 102, 255, 0.12);
        }

        .care-submit-ticket-btn {
          background: linear-gradient(135deg, #0866FF 0%, #0052CC 100%);
          color: #FFFFFF;
          border: none;
          padding: 12px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 6px;
          box-shadow: 0 4px 12px rgba(8, 102, 255, 0.3);
          transition: all 0.15s ease;
        }

        .care-submit-ticket-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(8, 102, 255, 0.45);
        }

        .care-submit-ticket-btn:disabled {
          background: #CBD5E1;
          box-shadow: none;
          cursor: not-allowed;
        }

        .care-ticket-err-banner {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #B91C1C;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .care-ticket-success-box {
          text-align: center;
          padding: 28px 14px;
        }

        .care-success-badge {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #DCFCE7;
          color: #15803D;
          font-size: 22px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
        }

        .care-ticket-success-box h4 {
          color: #0F172A !important;
          font-size: 16px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .care-ticket-success-box p {
          color: #475569;
          font-size: 13px;
        }

        .care-success-sub {
          margin-top: 6px;
          font-size: 12px !important;
          color: #64748B !important;
        }

        .care-btn-outline {
          background: #FFFFFF;
          border: 1.5px solid #CBD5E1;
          color: #0F172A;
          padding: 9px 16px;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 16px;
          transition: all 0.15s ease;
        }

        .care-btn-outline:hover {
          background: #F8FAFC;
          border-color: #0866FF;
          color: #0866FF;
        }

        @media (max-width: 768px) {
          .care-widget-root {
            bottom: 16px;
            right: 12px;
          }

          .care-widget-root.is-docked {
            right: 0;
            bottom: auto;
            top: 60%;
            transform: translateY(-50%);
          }

          .care-fab-btn {
            width: 44px;
            height: 44px;
          }

          .care-fab-close-toggle {
            top: -5px;
            left: -5px;
            width: 20px;
            height: 20px;
            font-size: 10px;
          }

          .care-drawer-modal {
            position: fixed;
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100vw;
            max-width: 100vw;
            height: 86vh;
            max-height: 86vh;
            border-radius: 24px 24px 0 0;
            box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.45);
            animation: careSlideUpMobile 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          }

          @keyframes careSlideUpMobile {
            from {
              opacity: 0;
              transform: translateY(100%);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .care-modal-header {
            padding: 14px 16px;
          }

          .care-input-bar {
            padding: 10px 14px calc(10px + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>
    </>
  );
}
