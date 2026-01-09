# Payment Gateway API Documentation

Base URL: `http://localhost:8000`

## Authentication
All protected endpoints require the following headers:
- `X-Api-Key`: Your Merchant API Key
- `X-Api-Secret`: Your Merchant API Secret

## Endpoints

### 1. Health Check
**GET** `/health`
Check if the API and Database are running.
**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Create Order
**POST** `/api/v1/orders`
Create a new payment order.
**Request Body:**
```json
{
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt_123",
  "notes": { "customer_name": "John Doe" }
}
```
**Response (201 Created):**
```json
{
  "id": "order_NXhj67fGH2jk9mPq",
  "merchant_id": "...",
  "amount": 50000,
  "currency": "INR",
  "status": "created",
  "created_at": "..."
}
```

### 3. Get Order
**GET** `/api/v1/orders/{order_id}`
Retrieve order details.

### 4. Create Payment (Process Transaction)
**POST** `/api/v1/payments`
Process a payment for an order.
**Request Body (UPI):**
```json
{
  "order_id": "order_NXhj67fGH2jk9mPq",
  "method": "upi",
  "vpa": "user@paytm"
}
```
**Request Body (Card):**
```json
{
  "order_id": "order_NXhj67fGH2jk9mPq",
  "method": "card",
  "card": {
    "number": "4111111111111111",
    "expiry_month": "12",
    "expiry_year": "2025",
    "cvv": "123",
    "holder_name": "John Doe"
  }
}
```

### 5. Get Payment
**GET** `/api/v1/payments/{payment_id}`
Get details and status of a payment.
**Response:**
```json
{
  "id": "pay_H8sK3jD9s2L1pQr",
  "status": "success",
  "method": "upi",
  ...
}
```
