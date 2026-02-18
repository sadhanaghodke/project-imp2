# MyCleanCity - Smart Civic Cleanliness Monitoring System

A complete, production-ready web application for managing civic cleanliness complaints with role-based access for Citizens, Workers, and Admins.

## 🌟 Features

### Citizens
- 📸 **Camera Capture**: Take photos directly from the app (gallery upload disabled for authenticity)
- 📍 **GPS Auto-detection**: Automatic location detection with manual adjustment
- 📋 **Complaint Tracking**: Real-time status updates (Pending → In Progress → Resolved)
- 🏆 **Reward System**: Earn points for valid complaints and resolutions
- ⭐ **Feedback System**: Rate and review completed work
- 📊 **Personal Dashboard**: Track your contributions and statistics

### Workers
- 📋 **Task Management**: View assigned complaints with detailed information
- 🗺️ **Map Integration**: See task locations with navigation
- 📸 **Progress Documentation**: Upload before and after cleaning images
- ✅ **Status Updates**: Update task progress in real-time
- 📈 **Performance Tracking**: Monitor completion rates and statistics

### Admins
- 🎛️ **Comprehensive Dashboard**: System-wide analytics and monitoring
- 👥 **Worker Management**: Assign tasks and monitor performance
- ✅ **Resolution Approval**: Review and approve completed work
- 📊 **Analytics**: Detailed reports on system performance
- 🏆 **Points Management**: Manage citizen reward points
- 📈 **Performance Metrics**: Track resolution rates and efficiency

## 🛠️ Tech Stack

- **Frontend**: React.js, Tailwind CSS, Axios, Leaflet Maps, React Router
- **Backend**: Node.js, Express.js, JWT Authentication, Multer, Sharp
- **Database**: PostgreSQL with PostGIS extension, Prisma ORM
- **Storage**: Local file system with organized directory structure
- **Security**: Helmet, CORS, Rate limiting, Input validation
- **AI Module**: Mock garbage detection (ready for ML integration)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- PostgreSQL 12+ with PostGIS extension
- Git

### Automated Setup
```bash
# Clone the repository
git clone <repository-url>
cd mycleancity

# Run automated setup
./setup.sh  # On Linux/Mac
# Or follow manual steps below for Windows
```

### Manual Setup

1. **Install Dependencies**
   ```bash
   npm run install-all
   ```

2. **Database Setup**
   ```bash
   # Create database
   createdb mycleancity
   
   # Enable PostGIS extension
   psql mycleancity -c "CREATE EXTENSION postgis;"
   ```

3. **Environment Configuration**
   ```bash
   # Backend environment (update DATABASE_URL with your credentials)
   cp backend/.env.example backend/.env
   
   # Frontend environment
   cp frontend/.env.example frontend/.env
   ```

4. **Database Migration & Seeding**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   npm run seed
   cd ..
   ```

5. **Start Application**
   ```bash
   npm run dev
   ```

6. **Access Application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:5000
   - **API Health**: http://localhost:5000/api/health

## 🔑 Demo Accounts

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Admin** | admin@mycleancity.com | admin123 | Full system access |
| **Worker** | worker1@mycleancity.com | worker123 | Task management |
| **Citizen** | citizen1@example.com | citizen123 | Report complaints |

## 📱 Application Workflow

1. **Citizen** captures garbage image using camera
2. **System** validates image using AI detection
3. **Citizen** confirms GPS location and adds description
4. **Admin** reviews and assigns complaint to worker
5. **Worker** uploads before cleaning image and starts work
6. **Worker** uploads after cleaning image and marks complete
7. **Admin** approves resolution (optional)
8. **Citizen** receives points and can provide feedback

## 🗄️ Database Schema

The application uses a comprehensive PostgreSQL schema with:
- **Users**: Role-based authentication (Citizens, Workers, Admins)
- **Complaints**: Core complaint data with GPS coordinates
- **Worker Assignments**: Task assignment and tracking
- **Before/After Images**: Work progress documentation
- **Admin Actions**: Audit trail of administrative actions
- **Feedback**: Citizen satisfaction ratings
- **Reward History**: Point tracking and gamification

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Complaints
- `POST /api/complaints` - Submit complaint (with image)
- `GET /api/complaints` - Get complaints (role-filtered)
- `GET /api/complaints/:id` - Get complaint details
- `PUT /api/complaints/:id/status` - Update status
- `POST /api/complaints/:id/before-image` - Upload before image
- `POST /api/complaints/:id/after-image` - Upload after image
- `POST /api/complaints/:id/feedback` - Submit feedback

### Admin
- `GET /api/admin/analytics` - Dashboard analytics
- `PUT /api/admin/complaints/:id/assign` - Assign worker
- `PUT /api/admin/complaints/:id/approve` - Approve resolution
- `GET /api/admin/workers` - Get workers list

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Theme**: Automatic theme detection
- **Real-time Updates**: Live status updates and notifications
- **Interactive Maps**: Leaflet integration with custom markers
- **Image Optimization**: Automatic compression and processing
- **Progressive Loading**: Optimized for slow connections
- **Accessibility**: WCAG compliant interface

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Role-based Access**: Granular permission system
- **Input Validation**: Comprehensive data validation
- **Rate Limiting**: API abuse prevention
- **Image Processing**: Secure file upload handling
- **CORS Protection**: Cross-origin request security
- **SQL Injection Prevention**: Prisma ORM protection

## 🤖 AI Integration

The system includes a mock AI module for garbage detection that can be easily replaced with real ML models:

- **Image Validation**: Ensures uploaded images contain garbage
- **Duplicate Detection**: Prevents duplicate submissions using image hashing
- **Severity Assessment**: Automatic priority assignment
- **Quality Checks**: Image clarity and lighting validation

## 📊 Analytics & Reporting

- **Real-time Dashboards**: Live system metrics
- **Performance Tracking**: Resolution rates and times
- **User Engagement**: Citizen participation metrics
- **Worker Efficiency**: Task completion analytics
- **Geographic Insights**: Heat maps of complaint areas

## 🚀 Production Deployment

1. **Environment Setup**
   ```bash
   NODE_ENV=production
   ```

2. **Build Frontend**
   ```bash
   cd frontend && npm run build
   ```

3. **Database Migration**
   ```bash
   cd backend && npx prisma migrate deploy
   ```

4. **Process Management**
   - Use PM2 or similar for Node.js process management
   - Configure reverse proxy (nginx) for static file serving
   - Setup SSL certificates
   - Configure database connection pooling

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test

# E2E tests
npm run test:e2e
```

## 📁 Project Structure

```
mycleancity/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, upload, validation
│   │   ├── routes/          # API routes
│   │   └── utils/           # Utilities, AI detection
│   ├── uploads/             # File storage
│   ├── prisma/              # Database schema & migrations
│   └── package.json
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Route components
│   │   ├── services/        # API services
│   │   └── contexts/        # React contexts
│   └── package.json
├── setup.sh                 # Automated setup script
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints above

## 🔄 Version History

- **v1.0.0**: Initial release with full functionality
  - Complete CRUD operations
  - Role-based authentication
  - Image upload and processing
  - Real-time status tracking
  - Reward system
  - Admin dashboard
  - Worker management
  - Mobile-responsive design

## API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- GET `/api/auth/profile` - Get user profile

### Complaints
- POST `/api/complaints` - Submit complaint
- GET `/api/complaints` - Get complaints (role-based)
- PUT `/api/complaints/:id/status` - Update complaint status
- POST `/api/complaints/:id/before-image` - Upload before cleaning image
- POST `/api/complaints/:id/after-image` - Upload after cleaning image

### Admin
- GET `/api/admin/analytics` - Dashboard analytics
- PUT `/api/admin/complaints/:id/assign` - Assign worker
- PUT `/api/admin/complaints/:id/approve` - Approve resolution

## Project Structure

```
mycleancity/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   ├── uploads/
│   ├── prisma/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
└── README.md
```

## Development Notes

- Images are stored locally in `backend/uploads/` with organized subdirectories
- GPS coordinates are stored using PostGIS POINT type
- JWT tokens expire in 24 hours
- File uploads are limited to 5MB per image
- Duplicate image detection uses SHA-256 hashing

## Production Deployment

1. Set NODE_ENV=production in backend/.env
2. Build frontend: `cd frontend && npm run build`
3. Configure reverse proxy (nginx) to serve static files
4. Use PM2 or similar for process management
5. Setup SSL certificates
6. Configure database connection pooling