# 🤖 AL MUKAMMAL — AI Customer Care Bot & Support Escalation Architecture

## 1. Overview
The Al Mukammal Customer Care Assistant provides 24/7 intelligent order inquiry, delivery status clarification, policy guidance, and seamless human support ticket escalation.

---

## 2. Zero-Trust Grounding & Security Guarantees
1. **No Hallucinations:**
   The bot never guesses or hallucinates an order's status, tracking number, or ETA. If information is absent or pending, it explicitly states: *"Your order is currently being prepared at our warehouse; an estimated delivery time will be updated once dispatched."*
2. **Strict Ownership Enforcement:**
   The bot never queries raw database collections. It queries discrete server-side tools that enforce:
   `customer._id === authenticatedSession.userId`.
   If a user asks about another customer's order ID (e.g. `ORD-8888`), the tool returns `ORDER_NOT_FOUND_OR_FORBIDDEN`.
3. **Policy vs. Live Data Boundary:**
   - **Policy Answers:** Sourced from curated knowledge embeddings (Return Policy: 14 days UAE standard, 1-year warranty on laptops, free UAE shipping above AED 5,000, 2-day standard delivery).
   - **Live Order Data:** Sourced strictly from the authenticated database backend.

---

## 3. Server-Side Tool Definitions

```javascript
export const CUSTOMER_SUPPORT_TOOLS = [
  {
    name: 'getCustomerOrders',
    description: 'List recent orders placed by the currently authenticated customer',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'getOrderTracking',
    description: 'Get real-time tracking, shipment status, and delivery partner info for a specific customer order',
    parameters: {
      type: 'object',
      properties: {
        orderIdOrNumber: { type: 'string', description: 'Order ID or order number' }
      },
      required: ['orderIdOrNumber']
    }
  },
  {
    name: 'requestReschedule',
    description: 'Request delivery rescheduling for an order that is undelivered or out for delivery',
    parameters: {
      type: 'object',
      properties: {
        orderNumber: { type: 'string' },
        preferredDate: { type: 'string' },
        reason: { type: 'string' }
      },
      required: ['orderNumber', 'preferredDate']
    }
  },
  {
    name: 'createSupportTicket',
    description: 'Escalate an unresolved issue to a human support agent at the Dubai showroom',
    parameters: {
      type: 'object',
      properties: {
        orderNumber: { type: 'string' },
        category: { type: 'string', enum: ['ORDER_DELAY', 'PACKAGE_DAMAGED', 'RETURN', 'OTHER'] },
        message: { type: 'string' }
      },
      required: ['category', 'message']
    }
  }
];
```

---

## 4. Escalation Workflow
When a customer indicates an emergency, delivery defect, damaged laptop box, or demands human assistance:
1. The assistant summarizes the inquiry.
2. The assistant calls `createSupportTicket` with priority set according to sentiment/urgency.
3. A unique Ticket ID (e.g., `TKT-202610-8421`) is issued to the customer.
4. Direct Dubai WhatsApp VIP desk link (`https://wa.me/971509550121?text=...`) is provided for immediate live human intervention.
