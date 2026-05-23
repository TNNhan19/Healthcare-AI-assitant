# API Documentation

## Base URL
```
http://localhost:8080/api/v1
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "userName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "0123456789",
  "address": ["123 Main St", "District 1", "Ho Chi Minh City"],
  "answer": "security_answer"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get User Profile
```http
GET /auth/profile
Authorization: Bearer <token>
```

### Products

#### Get All Products
```http
GET /products?page=1&limit=10&category=medications&search=paracetamol
```

#### Get Product by ID
```http
GET /products/:id
```

#### Get Products by Category
```http
GET /products/category/:category
```

### Orders

#### Create Order
```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "64f1a2b3c4d5e6f7g8h9i0j1",
      "name": "Paracetamol 500mg",
      "price": 15000,
      "quantity": 2,
      "image": "https://example.com/image.jpg",
      "category": "Medications",
      "prescription": false
    }
  ],
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "0123456789",
    "address": "123 Main Street",
    "city": "Ho Chi Minh City",
    "district": "District 1",
    "ward": "Ben Nghe"
  },
  "paymentMethod": "cash",
  "notes": "Please deliver in the morning",
  "prescriptionImages": ["prescription1.jpg", "prescription2.jpg"]
}
```

#### Get User Orders
```http
GET /orders?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

#### Get Order by ID
```http
GET /orders/:orderId
Authorization: Bearer <token>
```

#### Cancel Order
```http
PATCH /orders/:orderId/cancel
Authorization: Bearer <token>
```

#### Update Order Status (Admin)
```http
PATCH /orders/:orderId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderStatus": "shipped",
  "paymentStatus": "paid",
  "trackingNumber": "VN123456789",
  "estimatedDelivery": "2024-01-20T10:00:00.000Z"
}
```

#### Get Order Statistics (Admin)
```http
GET /orders/admin/statistics
Authorization: Bearer <token>
```

### Appointments

#### Get Available Time Slots
```http
GET /appointments/available-slots?date=2024-01-20&department=general
```

#### Book Appointment
```http
POST /appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientName": "John Doe",
  "patientPhone": "0123456789",
  "patientEmail": "john@example.com",
  "appointmentDate": "2024-01-20",
  "appointmentTime": "09:30",
  "appointmentType": "consultation",
  "department": "cardiology",
  "doctor": "Dr. Smith",
  "symptoms": "Chest pain and shortness of breath",
  "notes": "First time visit",
  "priority": "high"
}
```

#### Get User Appointments
```http
GET /appointments?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

#### Get Appointment by ID
```http
GET /appointments/:appointmentId
Authorization: Bearer <token>
```

#### Update Appointment
```http
PUT /appointments/:appointmentId
Authorization: Bearer <token>
Content-Type: application/json

{
  "appointmentDate": "2024-01-25",
  "appointmentTime": "14:00",
  "symptoms": "Updated symptoms description"
}
```

#### Cancel Appointment
```http
PATCH /appointments/:appointmentId/cancel
Authorization: Bearer <token>
```

#### Get Appointment Statistics (Admin)
```http
GET /appointments/admin/statistics
Authorization: Bearer <token>
```

### Health News

#### Get All Articles
```http
GET /health-news?page=1&limit=10&category=nutrition&featured=true&search=vitamin
```

#### Get Featured Articles
```http
GET /health-news/featured?limit=5
```

#### Get Article by Slug
```http
GET /health-news/:slug
```

#### Get Article Categories
```http
GET /health-news/categories
```

#### Like Article
```http
POST /health-news/:id/like
```

#### Create Article (Admin)
```http
POST /health-news
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Benefits of Vitamin C",
  "summary": "Learn about the importance of Vitamin C for immune health",
  "content": "Full article content here...",
  "author": "Dr. Jane Smith",
  "category": "nutrition",
  "tags": ["vitamin c", "immune system", "health"],
  "featuredImage": "https://example.com/vitamin-c.jpg",
  "images": ["https://example.com/image1.jpg"],
  "readTime": 5,
  "isFeatured": true,
  "metaTitle": "Vitamin C Benefits - Health Blog",
  "metaDescription": "Discover the amazing benefits of Vitamin C",
  "seoKeywords": ["vitamin c", "health", "immunity"]
}
```

#### Update Article (Admin)
```http
PUT /health-news/admin/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

#### Delete Article (Admin)
```http
DELETE /health-news/admin/:id
Authorization: Bearer <token>
```

### User Management

#### Update User Profile
```http
POST /user/update-profile
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "userName": "John Doe",
  "email": "john@example.com",
  "phone": "0123456789",
  "birthdate": "1990-01-01",
  "profilePicture": <file>
}
```

## Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Data Models

### Order Model
```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "user": "64f1a2b3c4d5e6f7g8h9i0j2",
  "items": [
    {
      "productId": "64f1a2b3c4d5e6f7g8h9i0j3",
      "name": "Paracetamol 500mg",
      "price": 15000,
      "quantity": 2,
      "image": "https://example.com/image.jpg",
      "category": "Medications",
      "prescription": false
    }
  ],
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "0123456789",
    "address": "123 Main Street",
    "city": "Ho Chi Minh City",
    "district": "District 1",
    "ward": "Ben Nghe"
  },
  "paymentMethod": "cash",
  "paymentStatus": "pending",
  "orderStatus": "pending",
  "subtotal": 30000,
  "shippingCost": 30000,
  "totalAmount": 60000,
  "notes": "Please deliver in the morning",
  "prescriptionImages": ["prescription1.jpg"],
  "trackingNumber": "",
  "estimatedDelivery": null,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

### Appointment Model
```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "user": "64f1a2b3c4d5e6f7g8h9i0j2",
  "patientName": "John Doe",
  "patientPhone": "0123456789",
  "patientEmail": "john@example.com",
  "appointmentDate": "2024-01-20",
  "appointmentTime": "09:30",
  "appointmentType": "consultation",
  "department": "cardiology",
  "doctor": "Dr. Smith",
  "symptoms": "Chest pain and shortness of breath",
  "notes": "First time visit",
  "status": "pending",
  "priority": "high",
  "reminderSent": false,
  "reminderDate": null,
  "cost": 0,
  "paymentStatus": "pending",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

### Health News Model
```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "title": "Benefits of Vitamin C",
  "slug": "benefits-of-vitamin-c",
  "summary": "Learn about the importance of Vitamin C for immune health",
  "content": "Full article content here...",
  "author": "Dr. Jane Smith",
  "category": "nutrition",
  "tags": ["vitamin c", "immune system", "health"],
  "featuredImage": "https://example.com/vitamin-c.jpg",
  "images": ["https://example.com/image1.jpg"],
  "status": "published",
  "publishedAt": "2024-01-15T10:00:00.000Z",
  "readTime": 5,
  "views": 150,
  "likes": 25,
  "shares": 10,
  "isFeatured": true,
  "metaTitle": "Vitamin C Benefits - Health Blog",
  "metaDescription": "Discover the amazing benefits of Vitamin C",
  "seoKeywords": ["vitamin c", "health", "immunity"],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Pagination

Most list endpoints support pagination with the following query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

## Filtering and Search

Many endpoints support filtering and search:
- `search` - Text search
- `category` - Filter by category
- `status` - Filter by status
- `featured` - Filter featured items

## File Upload

For file uploads (profile pictures, prescription images), use `multipart/form-data` content type.

## Rate Limiting

API endpoints are rate-limited to prevent abuse. Limits are applied per IP address.

## Error Handling

All endpoints return consistent error responses with appropriate HTTP status codes and descriptive error messages. 