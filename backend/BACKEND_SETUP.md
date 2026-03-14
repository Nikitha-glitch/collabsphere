# CollabSphere Backend - Setup & Development Guide

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher)
- **MongoDB** (local or cloud instance)
- **Git**

### Installation Steps

1. **Clone the Repository**
   ```bash
   cd collabsphere/backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your configuration
   ```

4. **Configure MongoDB**
   - **Local MongoDB:**
     ```
     MONGODB_URI=mongodb://localhost:27017/collabsphere
     ```
   
   - **MongoDB Atlas (Cloud):**
     ```
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/collabsphere
     ```

5. **Set JWT Secret**
   ```bash
   # Generate a strong secret key and add to .env
   JWT_SECRET=your_super_secret_key_generate_a_strong_one
   ```

6. **Start the Server**

   **Development Mode** (with auto-reload):
   ```bash
   npm run dev
   ```

   **Production Mode:**
   ```bash
   npm start
   ```

The server will start at `http://localhost:5000`

---

## 📁 Project Structure

### `/config`
- **db.js** - MongoDB connection configuration

### `/models`
- **User.js** - User profile, authentication, and preferences
- **Project.js** - Project details and team management
- **Event.js** - Event information and registrations
- **EventRegistration.js** - Event registration tracking
- **JoinRequest.js** - Join requests for projects
- **ChatLog.js** - Chatbot conversation history

### `/controllers`
- **authController.js** - Authentication logic (register, login, logout)
- **userController.js** - User profile management
- **projectController.js** - Project CRUD operations
- **eventController.js** - Event management
- **joinController.js** - Join request handling
- **registrationController.js** - Event registration management
- **chatbotController.js** - Chatbot interactions

### `/routes`
- **authRoutes.js** - Authentication endpoints
- **userRoutes.js** - User endpoints
- **projectRoutes.js** - Project endpoints
- **eventRoutes.js** - Event endpoints
- **joinRoutes.js** - Join request endpoints
- **registrationRoutes.js** - Event registration endpoints
- **chatbotRoutes.js** - Chatbot endpoints

### `/middleware`
- **authMiddleware.js** - JWT verification and authorization
- **errorMiddleware.js** - Global error handling

### `/services`
- **chatbotService.js** - Chatbot AI logic and responses
- **recommendationService.js** - Project and event recommendations

### `/utils`
- **generateToken.js** - JWT token creation and verification

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/profile/me` - Get current user profile
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user account

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `GET /api/projects/user/:userId` - Get user's projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add team member

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `GET /api/events/organizer/:organizerId` - Get organizer's events
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/register` - Register for event

### Join Requests
- `POST /api/join-requests` - Create join request
- `GET /api/join-requests` - Get join requests
- `PUT /api/join-requests/:id` - Respond to join request
- `DELETE /api/join-requests/:id` - Cancel join request

### Event Registrations
- `GET /api/registrations/my` - Get my registrations
- `DELETE /api/registrations/:id` - Cancel registration
- `GET /api/registrations/event/:eventId` - Get event registrations
- `POST /api/registrations/:id/feedback` - Submit feedback

### Chatbot
- `POST /api/chatbot/message` - Send message to chatbot
- `GET /api/chatbot/history/:sessionId` - Get chat history
- `DELETE /api/chatbot/history/:sessionId` - Delete chat history
- `POST /api/chatbot/feedback` - Submit chatbot feedback

---

## 🔐 Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/collabsphere

# JWT
JWT_SECRET=your_jwt_secret_key_change_this
JWT_EXPIRE=7d

# CORS
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
```

---

## 🧪 Testing the API

### Using cURL

**Example: Get all projects**
```bash
curl http://localhost:5000/api/projects
```

**Example: Create a project (requires auth)**
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Project","description":"Project description"}'
```

### Using Postman
1. Download and install [Postman](https://www.postman.com/downloads/)
2. Import API endpoints
3. Set up authorization tokens
4. Test endpoints

---

## 📊 Database Schema Overview

### User Schema
- Personal information (name, email, phone)
- Skills and expertise
- Professional details (institution, degree)
- Social links (GitHub, LinkedIn, portfolio)
- Role-based access control

### Project Schema
- Project details (title, description, category)
- Team management (creator, members)
- Skills requirements
- Status tracking
- Timeline and resources

### Event Schema
- Event information (title, description, type)
- Scheduling (start/end dates)
- Capacity and registration
- Organizer details
- Location or meeting link

### Join Request Schema
- Request tracking
- Cover letter and proposed role
- Status management
- Response tracking

### Event Registration Schema
- User-event mapping
- Registration status
- Attendance tracking
- Feedback collection

### ChatLog Schema
- Conversation history
- Session tracking
- User identification
- Feedback and ratings

---

## 🔄 Workflow & Best Practices

### Error Handling
The application uses centralized error handling middleware:
- Validation errors return 400
- Authentication errors return 401
- Authorization errors return 403
- Not found errors return 404
- Server errors return 500

### Authentication Flow
1. User registers account
2. Password is hashed with bcrypt
3. User logs in with credentials
4. JWT token is generated
5. Token is sent in Authorization header for protected routes
6. Middleware verifies token before processing request

### Request Structure
```javascript
// Protected route example
router.get('/profile', protect, (req, res) => {
  // req.user contains authenticated user data
  res.json(req.user);
});
```

---

## 🛠️ Development Workflow

### Adding New Features

1. **Create Model** (if needed)
   - Define schema in `/models`
   - Add validations and indexes

2. **Create Route**
   - Define endpoint in `/routes`
   - Add proper comments with HTTP method and description

3. **Create Controller**
   - Implement business logic in `/controllers`
   - Use `asyncHandler` for error handling
   - Add comprehensive comments

4. **Create Service** (if complex logic)
   - Extract reusable logic to `/services`
   - Keep controllers lean

5. **Test Endpoint**
   - Use Postman or cURL
   - Check request/response format
   - Verify error handling

### Code Style Guidelines
- Use camelCase for variables and functions
- Use PascalCase for classes and models
- Add comprehensive JSDoc comments
- Use meaningful variable names
- Keep functions single-responsibility
- Use async/await instead of callbacks

---

## 📝 Important Notes

### For Developers
1. **Never commit .env file** - Use .env.example as template
2. **Always validate user input** - Use express-validator or Mongoose validation
3. **Protect sensitive endpoints** - Use authentication middleware
4. **Log important actions** - For debugging and auditing
5. **Use consistent error responses** - For better frontend integration

### Database Backups
- Regular backups of MongoDB are recommended
- Set up automated backup schedules for production
- Keep backup credentials secure

### Performance Optimization
- Add indexes to frequently queried fields
- Implement pagination for large datasets
- Cache frequently accessed data
- Use database projections to limit fields returned

---

## 🚨 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB locally
mongod
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=5001
```

### Dependencies Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Documentation](https://jwt.io/)
- [bcryptjs Documentation](https://github.com/dcodeIO/bcrypt.js)

---

## 📞 Support

For issues or questions:
1. Check existing documentation
2. Review error logs
3. Check MongoDB connection
4. Verify environment variables
5. Review API endpoint structure

---

**Last Updated:** March 2026
**Version:** 1.0.0
