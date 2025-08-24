# Authentication System Documentation

## Overview

The Cake System implements a robust JWT-based authentication system using NestJS, TypeORM, and PostgreSQL. The system supports user registration, login, profile management, and token refresh capabilities with comprehensive validation and security features.

## Architecture

### Core Components

- **AuthController**: Handles HTTP requests for authentication endpoints
- **AuthService**: Business logic for user authentication and management
- **JwtStrategy**: Passport JWT strategy for token validation
- **JwtAuthGuard**: Guard to protect routes requiring authentication
- **User Entity**: Database model for user data
- **DTOs**: Data Transfer Objects for request/response validation

### Technology Stack

- **Framework**: NestJS with Fastify adapter
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Validation**: class-validator
- **Security**: Passport JWT strategy

## API Endpoints

### 1. User Registration

**Endpoint**: `POST /auth/register`

**Request Body**:
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

**Response** (201 Created):
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
    "latestLogin": "2024-01-15T10:30:00.000Z"
  }
}
```

**Validation Rules**:
- `fullname`: Required, non-empty string
- `phone`: Required, valid phone number format
- `email`: Required, valid email format
- `username`: Required, minimum 3 characters
- `password`: Required, minimum 6 characters
- `birthday`: Required, valid ISO date string

**Error Responses**:
- `409 Conflict`: Username, email, or phone already exists
- `400 Bad Request`: Validation errors

### 2. User Login

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "account": "johndoe", // Can be username, email, or phone
  "password": "securepassword123"
}
```

**Response** (200 OK):
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
    "latestLogin": "2024-01-15T10:30:00.000Z"
  }
}
```

**Features**:
- Multi-factor login: Users can login with username, email, or phone number
- Automatic `latestLogin` timestamp update
- Secure password verification with bcrypt

**Error Responses**:
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Validation errors

### 3. Get User Profile

**Endpoint**: `GET /auth/profile`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "id": "1",
  "fullname": "John Doe",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "phone": "+1234567890",
  "birthday": "1990-01-01T00:00:00.000Z",
  "latestLogin": "2024-01-15T10:30:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or expired token
- `401 Unauthorized`: User not found

### 4. Refresh Token

**Endpoint**: `POST /auth/refresh`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or expired token

## Security Features

### Password Security

- **Hashing**: bcrypt with salt rounds of 10
- **Validation**: Minimum 6 characters required
- **Storage**: Only hashed passwords stored in database

### JWT Token Security

- **Secret**: Configurable JWT secret key
- **Expiration**: Configurable token expiration (default: 7 days)
- **Payload**: Contains user ID and basic profile information
- **Validation**: Automatic token validation on protected routes

### Database Security

- **Unique Constraints**: Username, email, and phone number are unique
- **Indexes**: Optimized database indexes for performance
- **Validation**: Server-side validation using class-validator

### Route Protection

- **JWT Guard**: Protects sensitive endpoints
- **Automatic Validation**: Token validation and user extraction
- **Error Handling**: Proper error responses for unauthorized access

## Database Schema

### User Entity

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string; // bigint as string

  @Column({ type: 'varchar', length: 255 })
  fullname: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  password: string; // bcrypt hashed

  @Column({ type: 'date' })
  birthday: Date;

  @Column({ name: 'latest_login', type: 'timestamp', nullable: true })
  latestLogin: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### Database Indexes

```sql
-- Unique indexes for authentication fields
CREATE UNIQUE INDEX idx_user_email ON users(email);
CREATE UNIQUE INDEX idx_user_username ON users(username);
CREATE UNIQUE INDEX idx_user_phone ON users(phone);
```

## Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DATABASE=cake_system
POSTGRES_SSL=false
```

### Module Configuration

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
```

## Error Handling

### Common Error Responses

```typescript
// Registration conflicts
{
  "statusCode": 409,
  "message": "Username already exists",
  "error": "Conflict"
}

// Invalid credentials
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}

// Validation errors
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}

// Unauthorized access
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## Performance Considerations

### Database Optimization

- **Indexes**: Unique indexes on email, username, and phone for fast lookups
- **Connection Pooling**: TypeORM connection pooling for database efficiency
- **Query Optimization**: Selective field retrieval for profile endpoints

### Memory Management

- **Password Hashing**: Async bcrypt operations to prevent blocking
- **JWT Processing**: Efficient token generation and validation
- **User Lookup**: Optimized queries with proper indexing

### Scalability Features

- **Stateless Authentication**: JWT tokens enable horizontal scaling
- **Database Scaling**: PostgreSQL with read replicas support
- **Caching Ready**: Architecture supports Redis integration for session caching

## Testing

### Unit Tests

The system includes comprehensive unit tests for the AuthService:

```bash
# Run authentication tests
npm test -- auth.service.spec.ts
```

### Load Testing

Authentication endpoints are tested with the k6 load testing suite:

- **Registration Load**: High-frequency user registration testing
- **Login Stress**: Concurrent login testing with 20,000 users
- **Mixed Load**: Realistic authentication flow testing

## Security Best Practices

### Implementation

1. **Password Security**:
   - bcrypt hashing with appropriate salt rounds
   - Minimum password length enforcement
   - No password storage in plain text

2. **Token Security**:
   - Strong JWT secret keys
   - Appropriate token expiration times
   - Secure token transmission (HTTPS recommended)

3. **Input Validation**:
   - Server-side validation for all inputs
   - Email format validation
   - Phone number format validation
   - SQL injection prevention through TypeORM

4. **Error Handling**:
   - Generic error messages to prevent information disclosure
   - Proper HTTP status codes
   - Logging of security events

### Recommendations

1. **Production Deployment**:
   - Use strong, unique JWT secrets
   - Enable HTTPS/TLS encryption
   - Implement rate limiting
   - Set up monitoring and alerting

2. **Database Security**:
   - Use connection pooling
   - Implement database connection encryption
   - Regular security updates
   - Backup and recovery procedures

3. **Monitoring**:
   - Track authentication failures
   - Monitor for suspicious patterns
   - Implement audit logging
   - Set up performance metrics

## Future Enhancements

### Planned Features

1. **Multi-Factor Authentication (MFA)**
2. **OAuth2/Social Login Integration**
3. **Password Reset Functionality**
4. **Account Lockout Mechanisms**
5. **Session Management**
6. **Role-Based Access Control (RBAC)**

### Performance Improvements

1. **Redis Integration** for session caching
2. **Database Connection Optimization**
3. **JWT Token Blacklisting**
4. **Rate Limiting Implementation**

