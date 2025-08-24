# API Reference Documentation

This document provides comprehensive API reference for the Cake System, including all endpoints, request/response schemas, authentication requirements, and usage examples.

## Base URL

```
Local Development: http://localhost:3000
Production: https://your-production-domain.com
```

## Authentication

The Cake System uses JWT (JSON Web Token) based authentication. Protected endpoints require a valid JWT token in the Authorization header.

### Authentication Header Format
```http
Authorization: Bearer <jwt_token>
```

### Token Expiration
- **Default TTL**: 7 days
- **Refresh**: Use the `/auth/refresh` endpoint to get a new token

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "statusCode": 200,
  "data": { /* response data */ },
  "message": "Success message (optional)"
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error description or validation errors array",
  "error": "Error type",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/endpoint"
}
```

## Endpoints

## Authentication Endpoints

### 1. User Registration

**POST** `/auth/register`

Register a new user account.

#### Request Body
```json
{
  "fullname": "John Doe",
  "phone": "+1234567890",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "password": "securepassword123",
  "birthday": "1990-01-01"
}
```

#### Validation Rules
- `fullname`: Required, non-empty string, max 255 characters
- `phone`: Required, valid phone number format (+1234567890), unique
- `email`: Required, valid email format, unique, max 255 characters
- `username`: Required, minimum 3 characters, max 50 characters, unique
- `password`: Required, minimum 6 characters, max 255 characters
- `birthday`: Required, valid ISO date string (YYYY-MM-DD)

#### Response (201 Created)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "fullname": "John Doe",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "phone": "+1234567890",
    "birthday": "1990-01-01T00:00:00.000Z",
    "latestLogin": null,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### Error Responses
- **409 Conflict**: Username, email, or phone already exists
- **400 Bad Request**: Validation errors

#### Example cURL
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "John Doe",
    "phone": "+1234567890",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "password": "securepassword123",
    "birthday": "1990-01-01"
  }'
```

### 2. User Login

**POST** `/auth/login`

Authenticate user and receive JWT token.

#### Request Body
```json
{
  "account": "johndoe",
  "password": "securepassword123"
}
```

#### Parameters
- `account`: Username, email, or phone number
- `password`: User's password

#### Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "fullname": "John Doe",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "phone": "+1234567890",
    "birthday": "1990-01-01T00:00:00.000Z",
    "latestLogin": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses
- **401 Unauthorized**: Invalid credentials
- **400 Bad Request**: Validation errors

#### Example cURL
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "account": "johndoe",
    "password": "securepassword123"
  }'
```

### 3. Get User Profile

**GET** `/auth/profile` 🔒

Get current user's profile information.

#### Headers
```http
Authorization: Bearer <jwt_token>
Cache-Control: private, max-age=300
```

#### Response (200 OK)
```json
{
  "id": "1",
  "fullname": "John Doe",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "phone": "+1234567890",
  "birthday": "1990-01-01T00:00:00.000Z",
  "latestLogin": "2024-01-15T10:30:00.000Z",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Error Responses
- **401 Unauthorized**: Invalid or expired token
- **401 Unauthorized**: User not found

#### Example cURL
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <your_jwt_token>"
```

### 4. Refresh Token

**POST** `/auth/refresh` 🔒

Generate a new JWT token using the current valid token.

#### Headers
```http
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Error Responses
- **401 Unauthorized**: Invalid or expired token

#### Example cURL
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Authorization: Bearer <your_jwt_token>"
```

## Promotion Endpoints

### Campaign Management (Admin)

### 1. Create Campaign

**POST** `/promotions/campaigns`

Create a new promotion campaign.

#### Request Body
```json
{
  "name": "First Login Discount Campaign",
  "type": "first_login_discount",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z",
  "maxParticipants": 100,
  "discountPercentage": 30,
  "minTopupAmount": 10,
  "maxDiscountAmount": 50,
  "voucherValidityDays": 30
}
```

#### Validation Rules
- `name`: Required, string, max 255 characters
- `type`: Required, enum: `first_login_discount`
- `startDate`: Required, ISO date string
- `endDate`: Required, ISO date string, must be after startDate
- `maxParticipants`: Required, positive integer
- `discountPercentage`: Required, number between 1-100
- `minTopupAmount`: Required, positive number
- `maxDiscountAmount`: Optional, positive number
- `voucherValidityDays`: Required, positive integer

#### Response (201 Created)
```json
{
  "id": "1",
  "name": "First Login Discount Campaign",
  "type": "first_login_discount",
  "status": "active",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.000Z",
  "maxParticipants": 100,
  "currentParticipants": 0,
  "remainingSlots": 100,
  "discountPercentage": 30,
  "minTopupAmount": 10,
  "maxDiscountAmount": 50,
  "voucherValidityDays": 30,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

#### Example cURL
```bash
curl -X POST http://localhost:3000/promotions/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "First Login Discount Campaign",
    "type": "first_login_discount",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z",
    "maxParticipants": 100,
    "discountPercentage": 30,
    "minTopupAmount": 10,
    "maxDiscountAmount": 50,
    "voucherValidityDays": 30
  }'
```

### 2. Get Active Campaigns

**GET** `/promotions/campaigns`

Retrieve all active promotion campaigns.

#### Response (200 OK)
```json
[
  {
    "id": "1",
    "name": "First Login Discount Campaign",
    "type": "first_login_discount",
    "status": "active",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T23:59:59.000Z",
    "maxParticipants": 100,
    "currentParticipants": 45,
    "remainingSlots": 55,
    "discountPercentage": 30,
    "minTopupAmount": 10,
    "maxDiscountAmount": 50,
    "voucherValidityDays": 30,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
]
```

#### Example cURL
```bash
curl -X GET http://localhost:3000/promotions/campaigns
```

### 3. Get Campaign by ID

**GET** `/promotions/campaigns/:id`

Retrieve specific campaign details.

#### Path Parameters
- `id`: Campaign ID (string)

#### Response (200 OK)
```json
{
  "id": "1",
  "name": "First Login Discount Campaign",
  "type": "first_login_discount",
  "status": "active",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.000Z",
  "maxParticipants": 100,
  "currentParticipants": 45,
  "remainingSlots": 55,
  "discountPercentage": 30,
  "minTopupAmount": 10,
  "maxDiscountAmount": 50,
  "voucherValidityDays": 30,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

#### Error Responses
- **404 Not Found**: Campaign not found

#### Example cURL
```bash
curl -X GET http://localhost:3000/promotions/campaigns/1
```

### User Promotion Endpoints

### 4. Check Promotion Eligibility

**GET** `/promotions/eligibility` 🔒

Check if user is eligible for promotion campaigns.

#### Headers
```http
Authorization: Bearer <jwt_token>
```

#### Response (200 OK) - Eligible
```json
{
  "eligible": true,
  "campaignId": "1",
  "campaignName": "First Login Discount Campaign",
  "message": "You are eligible for the \"First Login Discount Campaign\" promotion. 55 slots remaining.",
  "remainingSlots": 55
}
```

#### Response (200 OK) - Not Eligible
```json
{
  "eligible": false,
  "message": "User has already participated in a promotion campaign"
}
```

#### Example cURL
```bash
curl -X GET http://localhost:3000/promotions/eligibility \
  -H "Authorization: Bearer <your_jwt_token>"
```

### 5. Manual First Login Tracking

**POST** `/promotions/track-first-login` 🔒

Manually trigger first login promotion enrollment.

#### Headers
```http
Authorization: Bearer <jwt_token>
```

#### Response (200 OK) - Success
```json
{
  "eligible": true,
  "participationOrder": 46,
  "message": "You're participant #46",
  "voucherIssued": true,
  "voucherCode": "CAKE-A1B2C3D4"
}
```

#### Response (200 OK) - Campaign Full
```json
{
  "eligible": false,
  "message": "Campaign is full"
}
```

#### Example cURL
```bash
curl -X POST http://localhost:3000/promotions/track-first-login \
  -H "Authorization: Bearer <your_jwt_token>"
```

### 6. Get User Promotions

**GET** `/promotions/my-promotions` 🔒

Get user's promotion participation history.

#### Headers
```http
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
[
  {
    "id": "1",
    "campaignId": "1",
    "campaignName": "First Login Discount Campaign",
    "participationOrder": 46,
    "status": "voucher_issued",
    "firstLoginAt": "2024-01-15T10:30:00.000Z",
    "voucherIssuedAt": "2024-01-15T10:30:05.000Z",
    "voucherUsedAt": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:05.000Z"
  }
]
```

#### Example cURL
```bash
curl -X GET http://localhost:3000/promotions/my-promotions \
  -H "Authorization: Bearer <your_jwt_token>"
```

### Voucher Management

### 7. Get User Vouchers

**GET** `/promotions/my-vouchers` 🔒

Get user's available and used vouchers.

#### Headers
```http
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
[
  {
    "id": "1",
    "code": "CAKE-A1B2C3D4",
    "type": "mobile_topup_discount",
    "status": "active",
    "discountPercentage": 30,
    "minTopupAmount": 10,
    "maxDiscountAmount": 50,
    "issuedAt": "2024-01-15T10:30:05.000Z",
    "expiresAt": "2024-02-14T10:30:05.000Z",
    "usedAt": null,
    "usedAmount": null,
    "discountAmount": null,
    "transactionReference": null,
    "isValid": true,
    "isExpired": false
  }
]
```

#### Example cURL
```bash
curl -X GET http://localhost:3000/promotions/my-vouchers \
  -H "Authorization: Bearer <your_jwt_token>"
```

### 8. Validate Voucher

**GET** `/promotions/vouchers/:code/validate`

Validate a voucher code (public endpoint).

#### Path Parameters
- `code`: Voucher code (string)

#### Response (200 OK) - Valid Voucher
```json
{
  "id": "1",
  "code": "CAKE-A1B2C3D4",
  "type": "mobile_topup_discount",
  "status": "active",
  "discountPercentage": 30,
  "minTopupAmount": 10,
  "maxDiscountAmount": 50,
  "issuedAt": "2024-01-15T10:30:05.000Z",
  "expiresAt": "2024-02-14T10:30:05.000Z",
  "isValid": true,
  "isExpired": false
}
```

#### Error Responses
- **404 Not Found**: Voucher not found
- **400 Bad Request**: Voucher expired or already used

#### Example cURL
```bash
curl -X GET http://localhost:3000/promotions/vouchers/CAKE-A1B2C3D4/validate
```

### Mobile Top-up

### 9. Process Mobile Top-up

**POST** `/promotions/topup` 🔒

Process mobile phone top-up with voucher discount.

#### Headers
```http
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "phoneNumber": "+1234567890",
  "amount": 100,
  "voucherCode": "CAKE-A1B2C3D4",
  "paymentMethod": "bank_transfer"
}
```

#### Validation Rules
- `phoneNumber`: Required, valid phone number format
- `amount`: Required, positive number, must meet voucher minimum
- `voucherCode`: Required, valid voucher code
- `paymentMethod`: Required, enum: `bank_transfer`

#### Response (200 OK)
```json
{
  "success": true,
  "transactionId": "TXN-1756069214522-5OXF2S",
  "originalAmount": 100,
  "discountAmount": 30,
  "finalAmount": 70,
  "phoneNumber": "+1234567890",
  "voucherCode": "CAKE-A1B2C3D4",
  "paymentMethod": "bank_transfer",
  "processedAt": "2024-01-15T11:00:00.000Z",
  "message": "Top-up successful! You saved 30 with your voucher."
}
```

#### Error Responses
- **400 Bad Request**: Invalid voucher or insufficient amount
- **401 Unauthorized**: Voucher doesn't belong to user
- **400 Bad Request**: Payment processing failed

#### Example cURL
```bash
curl -X POST http://localhost:3000/promotions/topup \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "amount": 100,
    "voucherCode": "CAKE-A1B2C3D4",
    "paymentMethod": "bank_transfer"
  }'
```

## System Endpoints

### 1. Health Check

**GET** `/health`

Check system health status.

#### Response (200 OK) - Healthy
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T11:00:00.000Z",
  "uptime": 3600,
  "responseTime": 15,
  "checks": {
    "database": "healthy",
    "memory": "healthy",
    "cache": "healthy"
  },
  "memory": {
    "used": 512,
    "total": 1024,
    "external": 128
  }
}
```

#### Response (503 Service Unavailable) - Unhealthy
```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-15T11:00:00.000Z",
  "error": "Database connection failed"
}
```

#### Example cURL
```bash
curl -X GET http://localhost:3000/health
```

### Admin Endpoints

### 2. Get Queue Statistics

**GET** `/admin/events/queue-stats`

Get event queue statistics (admin endpoint).

#### Response (200 OK)
```json
{
  "userEvents": {
    "waiting": 5,
    "active": 2,
    "completed": 1250,
    "failed": 3
  },
  "promotionEvents": {
    "waiting": 0,
    "active": 0,
    "completed": 450,
    "failed": 1
  }
}
```

#### Example cURL
```bash
curl -X GET http://localhost:3000/admin/events/queue-stats
```

### 3. Retry Failed Jobs

**POST** `/admin/events/retry-failed`

Retry all failed jobs in the event queues.

#### Response (200 OK)
```json
{
  "message": "Retrying failed jobs",
  "userEventsRetried": 3,
  "promotionEventsRetried": 1
}
```

#### Example cURL
```bash
curl -X POST http://localhost:3000/admin/events/retry-failed
```

## Error Codes

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT, PATCH requests |
| 201 | Created | Successful POST requests |
| 400 | Bad Request | Validation errors, malformed requests |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists (e.g., duplicate username) |
| 422 | Unprocessable Entity | Semantic validation errors |
| 429 | Too Many Requests | Rate limiting exceeded |
| 500 | Internal Server Error | Server-side errors |
| 503 | Service Unavailable | System maintenance or overload |

### Common Error Messages

#### Authentication Errors
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

#### Validation Errors
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

#### Resource Conflict
```json
{
  "statusCode": 409,
  "message": "Username already exists",
  "error": "Conflict"
}
```

#### Rate Limiting
```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "ThrottlerException"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Limit**: 100 requests per minute per IP address
- **Window**: 60 seconds (sliding window)
- **Headers**: Rate limit information included in response headers

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

## Data Types

### User Object
```typescript
{
  id: string;                    // Unique user ID
  fullname: string;              // User's full name
  email: string;                 // Email address (unique)
  username: string;              // Username (unique)
  phone: string;                 // Phone number (unique)
  birthday: string;              // ISO date string
  latestLogin: string | null;    // ISO timestamp or null
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}
```

### Campaign Object
```typescript
{
  id: string;                    // Unique campaign ID
  name: string;                  // Campaign name
  type: string;                  // Campaign type
  status: string;                // Campaign status
  startDate: string;             // ISO timestamp
  endDate: string;               // ISO timestamp
  maxParticipants: number;       // Maximum participants
  currentParticipants: number;   // Current participant count
  remainingSlots: number;        // Available slots
  discountPercentage: number;    // Discount percentage
  minTopupAmount: number;        // Minimum top-up amount
  maxDiscountAmount: number;     // Maximum discount amount
  voucherValidityDays: number;   // Voucher validity in days
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}
```

### Voucher Object
```typescript
{
  id: string;                    // Unique voucher ID
  code: string;                  // Voucher code
  type: string;                  // Voucher type
  status: string;                // Voucher status
  discountPercentage: number;    // Discount percentage
  minTopupAmount: number;        // Minimum top-up amount
  maxDiscountAmount: number;     // Maximum discount amount
  issuedAt: string;              // ISO timestamp
  expiresAt: string;             // ISO timestamp
  usedAt: string | null;         // ISO timestamp or null
  usedAmount: number | null;     // Amount used or null
  discountAmount: number | null; // Discount applied or null
  transactionReference: string | null; // Transaction ID or null
  isValid: boolean;              // Validity status
  isExpired: boolean;            // Expiration status
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
class CakeSystemAPI {
  private baseURL: string;
  private token?: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    this.token = data.access_token;
    return data;
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    this.token = data.access_token;
    return data;
  }

  async getProfile(): Promise<User> {
    const response = await fetch(`${this.baseURL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    
    if (!response.ok) {
      throw new Error(`Get profile failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  async processTopup(topupData: TopupRequest): Promise<TopupResponse> {
    const response = await fetch(`${this.baseURL}/promotions/topup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(topupData)
    });
    
    if (!response.ok) {
      throw new Error(`Topup failed: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

### Python

```python
import requests
from typing import Optional, Dict, Any

class CakeSystemAPI:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.token: Optional[str] = None
        
    def register(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        response = requests.post(
            f"{self.base_url}/auth/register",
            json=user_data
        )
        response.raise_for_status()
        data = response.json()
        self.token = data["access_token"]
        return data
        
    def login(self, credentials: Dict[str, str]) -> Dict[str, Any]:
        response = requests.post(
            f"{self.base_url}/auth/login",
            json=credentials
        )
        response.raise_for_status()
        data = response.json()
        self.token = data["access_token"]
        return data
        
    def get_profile(self) -> Dict[str, Any]:
        response = requests.get(
            f"{self.base_url}/auth/profile",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        response.raise_for_status()
        return response.json()
        
    def process_topup(self, topup_data: Dict[str, Any]) -> Dict[str, Any]:
        response = requests.post(
            f"{self.base_url}/promotions/topup",
            json=topup_data,
            headers={"Authorization": f"Bearer {self.token}"}
        )
        response.raise_for_status()
        return response.json()
```

## Postman Collection

A complete Postman collection is available for testing all endpoints. Import the following JSON:

```json
{
  "info": {
    "name": "Cake System API",
    "description": "Complete API collection for Cake System",
    "version": "1.0.0"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{token}}"
      }
    ]
  }
}
```

## Testing

### Integration Testing
```bash
# Run API integration tests
npm run test:e2e

# Run specific endpoint tests
npm run test:e2e -- --testNamePattern="Auth endpoints"
```

### Load Testing
```bash
# Test API performance
cd k6-load-test
./run-tests.sh --type mixed --url http://localhost:3000
```
