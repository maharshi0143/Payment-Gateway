# System Architecture

## Component Overview

```mermaid
graph TD
    Client[Client Browser]
    Merchant[Merchant Server]
    
    subgraph "Payment Gateway System"
        API[API Service (Node.js)]
        Worker[Worker Service (Node.js)]
        Redis[(Redis Queue)]
        DB[(PostgreSQL)]
        Dashboard[Dashboard (React)]
        Checkout[Checkout SDK (React)]
    end

    Client -- "1. Initiates Pay" --> Merchant
    Merchant -- "2. Creates Order" --> API
    API -- "3. Returns OrderID" --> Merchant
    Merchant -- "4. Passes OrderID" --> Client
    Client -- "5. Loads SDK" --> Checkout
    Checkout -- "6. Submits Payment" --> API
    
    API -- "7. Enqueue Job" --> Redis
    API -- "8. Return Pending" --> Checkout
    
    Redis -- "9. Process Job" --> Worker
    Worker -- "10. Update Status" --> DB
    Worker -- "11. Send Webhook" --> Merchant
    
    Dashboard -- "Manage/View" --> API
    API -- "Read/Write" --> DB
```

## Async Payment Flow

```mermaid
sequenceDiagram
    participant U as User
    participant SDK as Checkout SDK
    participant API as Gateway API
    participant Q as Redis Queue
    participant W as Worker
    participant DB as Database
    participant M as Merchant Webhook

    U->>SDK: Enter Card Details & Pay
    SDK->>API: POST /payments (Async)
    API->>DB: Create Payment (Status: Pending)
    API->>Q: Add 'process_payment' Job
    API-->>SDK: 201 Created (Pending)
    SDK-->>U: Show "Processing..."
    
    Note over W, Q: Worker picks up job
    W->>Q: Process Job
    W->>W: Simulate Bank Delay (3s)
    W->>DB: Update Status (Success/Failed)
    W->>Q: Add 'deliver_webhook' Job
    
    Note over W, M: Webhook Worker
    W->>M: POST /webhook (Signature Signed)
    M-->>W: 200 OK
    W->>DB: Log Webhook Success
```

## Database Schema

```mermaid
erDiagram
    MERCHANT ||--o{ ORDER : creates
    MERCHANT ||--o{ PAYMENT : receives
    MERCHANT ||--o{ REFUND : processes
    MERCHANT ||--o{ WEBHOOK_LOG : logs
    
    ORDER ||--|{ PAYMENT : has
    PAYMENT ||--o{ REFUND : has
    
    MERCHANT {
        uuid id
        string email
        string api_key
        string webhook_secret
    }
    
    ORDER {
        string id
        int amount
        string currency
        string status
    }
    
    PAYMENT {
        string id
        string status
        boolean captured
        string method
    }
    
    WEBHOOK_LOG {
        int id
        string event
        string status
        int attempts
    }
```
