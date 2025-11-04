# LeakHere - Media Sharing Platform 💧

A modern, full-stack media sharing platform built with React and AWS serverless architecture for uploading, sharing, and discovering images, videos, and GIFs.

![LeakHere Platform](https://img.shields.io/badge/React-18.x-blue) ![AWS](https://img.shields.io/badge/AWS-Serverless-orange) ![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

### 📤 Media Management
* **Smart Upload System:** Drag-and-drop or click-to-browse upload with real-time progress tracking
* **Multi-Format Support:** Images (PNG, JPG, WEBP), Videos (MP4, WEBM), and GIFs
* **Batch Uploads:** Upload multiple files simultaneously with individual progress indicators
* **Pre-signed URL Upload:** Direct-to-S3 uploads for optimal performance

### 🎨 User Interface
* **Responsive Masonry Grid:** Dynamic grid layout adapts to all screen sizes
* **Advanced Filtering:** Filter by type (All, Images, Videos, GIFs, Documents) with instant results
* **Smart Sorting:** Sort by Recent, Most Viewed, Downloads, or Most Liked with visible labels on mobile
* **Real-time Search:** Search media with instant query synchronization
* **Theme Toggle:** Seamless dark/light mode switching with CSS variables
* **Video Indicators:** Visual overlays distinguish videos from images
* **Content Preview Cards:** Display uploader name and upload date on each media card for quick identification

### 🎬 Media Viewing
* **Dedicated Media Pages:** Full-screen viewing experience for each media item
* **Video Playback:** Shaka Player (Google's open-source player) with adaptive streaming support
* **Video Preview on Hover:** Auto-play video previews on card hover (desktop)
* **Document Viewer:** Integrated PDF and Office document preview with zoom controls
* **Media Details:** Title, description, uploader info, dates, and statistics
* **Engagement Stats:** View counts, download counts, like counts displayed prominently
* **Mobile-Optimized Layout:** Seamless card-style design with uploader info and stats below media
* **Responsive Design:** Efficient spacing and layout optimized for mobile devices

### 💬 Social Features
* **Comments System:** Threaded comments with reply support
* **Likes:** Like/unlike media (authentication required)
* **Sharing:** Native share API integration + copy-to-clipboard fallback
* **User Profiles:** Basic profile pages with user statistics
* **Content Reporting:** Report inappropriate content with categorized reasons

### 🔐 Authentication
* **Modal-based Auth:** Clean login/registration flow without page redirects
* **Protected Routes:** Automatic redirection for authenticated-only features
* **Persistent Sessions:** Token-based authentication with auto-refresh
* **User Context:** Global authentication state management

### 📱 User Experience
* **Infinite Scroll:** Automatic content loading as users scroll
* **Toast Notifications:** Real-time feedback for all user actions
* **Loading States:** Smooth loading indicators centered on screen
* **Error Handling:** Graceful error messages and recovery options
* **Accessibility:** ARIA labels, keyboard navigation, screen reader support
* **Mobile-First Design:** Optimized touch interactions and compact layouts
* **Scroll Indicators:** Visual cues for horizontally scrollable filter groups

---

## 💻 Tech Stack

### Frontend Framework
```
React 18.x
├── React Router DOM v6     # Client-side routing
├── React Hooks             # useState, useEffect, useContext, useCallback
└── Context API             # Global state management (Auth)
```

### UI Libraries & Components
```
UI Components
├── lucide-react           # Modern icon library (500+ icons)
├── react-masonry-css      # Responsive masonry grid layout
├── react-toastify         # Toast notification system
├── shaka-player           # Google's adaptive video player
└── styled-jsx            # Component-scoped CSS-in-JS
```

### Styling Architecture
```
CSS Architecture
├── Global Styles          # CSS Variables, resets, base styles
├── CSS Variables          # Theme colors, spacing, shadows
├── styled-jsx            # Component-scoped styles
└── Responsive Design      # Mobile-first breakpoints
```

### API & Data Management
```
Data Layer
├── Axios                  # HTTP client for API requests
├── Custom API Services    # Modular API service layer
│   ├── filesAPI          # File operations
│   ├── commentsAPI       # Comment management
│   ├── authAPI           # Authentication
│   └── reportAPI         # Content reporting
└── Error Interceptors     # Global error handling
```

### Build Tools
```
Development Tools
├── Create React App       # Build toolchain
├── Webpack               # Module bundler (via CRA)
├── Babel                 # JavaScript compiler
└── ESLint                # Code linting
```

---

## ☁️ AWS Backend Architecture (Serverless)

### Infrastructure Overview
```
┌─────────────────────────────────────────────────────────┐
│                    CloudFront CDN                        │
│              (Optional - Media Delivery)                 │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│                   API Gateway                            │
│     (REST API - Request Routing & Validation)           │
└──────────────────┬──────────────────────────────────────┘
                   │
      ┌────────────┼────────────┐
      │            │            │
┌─────▼─────┐ ┌───▼────┐ ┌────▼─────┐
│  Lambda    │ │ Lambda │ │  Lambda  │
│  (Files)   │ │ (Auth) │ │(Comments)│
└─────┬─────┘ └───┬────┘ └────┬─────┘
      │           │            │
      └───────────┼────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
┌─────▼─────┐          ┌─────▼─────┐
│ DynamoDB  │          │    S3     │
│ (Metadata)│          │  (Media)  │
└───────────┘          └───────────┘
```

### AWS Services Breakdown

#### **Amazon API Gateway**
- **Role:** RESTful API endpoint for all client requests
- **Features:**
  - CORS configuration for React app
  - Request validation and throttling
  - API key management (optional)
  - Stage management (dev, prod)
- **Endpoints:**
  ```
  /api/files              # GET, POST
  /api/files/{id}         # GET, PUT, DELETE
  /api/auth/login         # POST
  /api/auth/register      # POST
  /api/comments           # GET, POST
  /api/reports            # POST
  ```

#### **AWS Lambda Functions**
- **Role:** Serverless compute for business logic
- **Runtime:** Node.js 18.x (or Python 3.x)
- **Functions:**
  ```
  FileUploadHandler       # Generate pre-signed S3 URLs
  FileListHandler         # Fetch paginated file lists
  FileDetailsHandler      # Get individual file metadata
  AuthHandler             # User login/registration
  CommentHandler          # CRUD operations for comments
  LikeHandler             # Toggle likes on media
  ReportHandler           # Submit content reports
  SearchHandler           # Search media by query
  ```
- **Configuration:**
  - Memory: 256MB - 1024MB
  - Timeout: 10-30 seconds
  - Environment variables for DB connections
  - IAM roles for S3 and DynamoDB access

#### **Amazon S3 (Simple Storage Service)**
- **Role:** Scalable object storage for media files
- **Buckets:**
  ```
  leakhere-media-prod/
  ├── images/
  ├── videos/
  ├── gifs/
  └── documents/
  ```
- **Features:**
  - **Pre-signed URL generation:** Secure, time-limited URLs for direct uploads/downloads
  - **Direct-to-S3 uploads:** Client uploads directly to S3 using pre-signed URLs
  - Lifecycle policies for old content
  - Versioning enabled
  - Server-side encryption (SSE-S3)
  - CloudFront integration for fast content delivery

#### **Amazon DynamoDB**
- **Role:** NoSQL database for metadata and user data
- **Tables:**
  ```
  Files Table
  ├── PK: file_id (String)
  ├── SK: created_at (Number)
  ├── Attributes: title, description, file_type, s3_key,
  │               uploader_id, view_count, like_count, etc.
  └── GSI: uploader_id-index, type-index
  
  Users Table
  ├── PK: user_id (String)
  ├── Attributes: username, email, password_hash, created_at
  └── GSI: email-index
  
  Comments Table
  ├── PK: comment_id (String)
  ├── SK: file_id (String)
  ├── Attributes: user_id, text, parent_id, created_at
  └── GSI: file_id-index
  
  Likes Table
  ├── PK: user_id#file_id (String)
  └── Attributes: liked_at
  ```

#### **Amazon CloudFront (Optional)**
- **Role:** Content Delivery Network (CDN)
- **Benefits:**
  - Reduced latency for global users
  - HTTPS enforcement
  - Caching strategy for media files
  - Origin: S3 bucket
- **Configuration:**
  - Cache behavior: 24-hour TTL for media
  - Custom domain support
  - SSL certificate via ACM

#### **Amazon Cognito (Optional)**
- **Role:** User authentication and authorization
- **Features:**
  - User pools for sign-up/sign-in
  - JWT token generation
  - Password policies and MFA
  - Social identity providers
  - API Gateway authorizers

#### **AWS CloudWatch**
- **Role:** Monitoring and logging
- **Features:**
  - Lambda function logs
  - API Gateway access logs
  - Custom metrics (upload counts, error rates)
  - Alarms for error thresholds

---

## 📁 Project Structure

```
leakhere/
│
├── public/
│   ├── index.html              # HTML template
│   ├── favicon.ico             # App icon
│   └── manifest.json           # PWA manifest
│
├── src/
│   ├── components/             # Reusable React components
│   │   ├── Header.jsx          # Navigation header with search
│   │   ├── MediaCard.jsx       # Individual media item card
│   │   ├── UploadModal.jsx     # File upload modal with progress
│   │   ├── AuthModal.jsx       # Login/Registration modal
│   │   ├── ReportModal.jsx     # Content reporting modal
│   │   ├── Comment.jsx         # Single comment component
│   │   └── ProtectedRoute.jsx  # Auth-required route wrapper
│   │
│   ├── pages/                  # Page-level components
│   │   ├── Home.jsx            # Main feed with masonry grid
│   │   ├── MediaDetail.jsx     # Individual media view page
│   │   └── Profile.jsx         # User profile page
│   │
│   ├── context/                # React Context providers
│   │   └── AuthContext.jsx     # Authentication state management
│   │
│   ├── services/               # API service layer
│   │   └── api.js              # Axios instances & API methods
│   │       ├── filesAPI        # File operations
│   │       ├── commentsAPI     # Comment management
│   │       ├── authAPI         # Authentication
│   │       └── reportAPI       # Reporting system
│   │
│   ├── styles/                 # Global styles
│   │   └── globals.css         # CSS variables, resets, utilities
│   │
│   ├── utils/                  # Helper functions
│   │   ├── formatters.js       # Date/number formatting
│   │   └── validators.js       # Input validation
│   │
│   ├── App.jsx                 # Root component with routing
│   ├── index.js                # React DOM entry point
│   └── reportWebVitals.js      # Performance monitoring
│
├── .env                        # Environment variables
├── .env.example                # Example environment file
├── .gitignore                  # Git ignore rules
├── package.json                # Dependencies & scripts
├── package-lock.json           # Locked dependency versions
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v16 or later) - [Download](https://nodejs.org/)
- **npm** (v8+) or **yarn** (v1.22+)
- **Git** - [Download](https://git-scm.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/psc856/leakhere.git
   cd leakhere
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   # API Configuration
   REACT_APP_API_BASE_URL=https://your-api-gateway-id.execute-api.region.amazonaws.com/prod/api
   
   # Optional: Analytics
   REACT_APP_GA_TRACKING_ID=UA-XXXXXXXXX-X
   
   # Optional: Feature Flags
   REACT_APP_ENABLE_REPORTS=true
   REACT_APP_ENABLE_COMMENTS=true
   ```

4. **Start the development server:**
   ```bash
   npm start
   # or
   yarn start
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

---

## 🛠️ Available Scripts

### Development
```bash
npm start          # Start development server (localhost:3000)
npm run build      # Create production build
npm test           # Run test suite
npm run eject      # Eject from Create React App (irreversible)
```

### Code Quality
```bash
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

---

## 🎨 Component Details

### Custom Components

#### **CustomSelect Component**
- **Location:** `src/pages/Home.jsx`, `src/components/ReportModal.jsx`
- **Features:**
  - Fully accessible dropdown with ARIA labels
  - Custom styling without white bullet points
  - Icon support with proper spacing
  - Keyboard navigation support
  - Click-outside-to-close functionality
- **Props:**
  ```javascript
  {
    label: string,
    options: Array<{value: string, label: string, icon: JSX.Element}>,
    value: string,
    onChange: (key: string, value: string) => void
  }
  ```

#### **MediaCard Component**
- **Features:**
  - Responsive image/video thumbnails
  - Hover effects with smooth transitions
  - Video indicator overlay (play icon)
  - Auto-play video preview on hover (desktop)
  - Lazy loading support with skeleton loaders
  - Click handler for navigation
  - Uploader name and upload date display

#### **VideoPlayer Component**
- **Technology:** Shaka Player (Google's open-source adaptive streaming player)
- **Features:**
  - Adaptive bitrate streaming (DASH/HLS support)
  - Custom UI controls (play/pause, volume, fullscreen, seek bar)
  - Browser compatibility checks
  - Automatic quality adjustment
  - Mobile-optimized playback
- **Configuration:**
  ```javascript
  controlPanelElements: ['play_pause', 'time_and_duration', 'spacer', 'mute', 'volume', 'fullscreen']
  ```

#### **UploadModal Component**
- **Features:**
  - Drag-and-drop zone
  - Multiple file selection
  - Real-time upload progress bars
  - File type validation
  - Preview thumbnails
  - Batch upload support

---

## 🎯 API Integration

### API Service Structure

```javascript
// src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// File operations
export const filesAPI = {
  getAll: (params) => apiClient.get('/files', { params }),
  getById: (id) => apiClient.get(`/files/${id}`),
  getPresignedUrl: (data) => apiClient.post('/files/presigned-url', data),
  upload: (formData) => apiClient.post('/files/upload', formData),
  uploadToS3: (presignedUrl, file) => axios.put(presignedUrl, file),
  delete: (id) => apiClient.delete(`/files/${id}`),
};

// Comment operations
export const commentsAPI = {
  getByFileId: (fileId) => apiClient.get(`/comments/${fileId}`),
  create: (data) => apiClient.post('/comments', data),
  delete: (id) => apiClient.delete(`/comments/${id}`),
};

// Authentication
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
};

// Reporting
export const reportAPI = {
  sendReport: (data) => apiClient.post('/reports', data),
};
```

---

## 🌐 Deployment

### Frontend Deployment (AWS S3 + CloudFront)

1. **Build the production bundle:**
   ```bash
   npm run build
   ```

2. **Create S3 bucket:**
   ```bash
   aws s3 mb s3://leakhere-frontend
   ```

3. **Upload build files:**
   ```bash
   aws s3 sync build/ s3://leakhere-frontend --delete
   ```

4. **Configure CloudFront distribution:**
   - Origin: S3 bucket
   - Default root object: `index.html`
   - Error pages: Redirect 404 to `index.html` (SPA routing)

### Backend Deployment (AWS SAM/Serverless Framework)

```yaml
# serverless.yml example
service: leakhere-backend

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    DYNAMODB_TABLE: ${self:service}-${opt:stage, 'dev'}

functions:
  fileUpload:
    handler: handlers/files.upload
    events:
      - http:
          path: api/files/upload
          method: post
          cors: true

resources:
  Resources:
    FilesTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.DYNAMODB_TABLE}
        AttributeDefinitions:
          - AttributeName: file_id
            AttributeType: S
        KeySchema:
          - AttributeName: file_id
            KeyType: HASH
        BillingMode: PAY_PER_REQUEST
```

Deploy:
```bash
serverless deploy --stage prod
```

---

## 🔒 Security Best Practices

- **Authentication:** JWT tokens with expiration
- **Authorization:** Role-based access control
- **Pre-signed URLs:** Time-limited, secure S3 access without exposing credentials
- **Input Validation:** Server-side validation for all inputs
- **CORS:** Restricted to frontend domain
- **Rate Limiting:** API Gateway throttling enabled
- **Encryption:** HTTPS only, S3 encryption at rest
- **Secrets:** AWS Secrets Manager for sensitive data

---

## 📈 Performance Optimizations

- **Code Splitting:** React.lazy for route-based splitting
- **Image Optimization:** WebP format, responsive images
- **Video Optimization:** Shaka Player adaptive streaming, metadata preload, muted autoplay for previews
- **Caching:** CloudFront for static assets, browser caching
- **Lazy Loading:** Infinite scroll, intersection observer
- **Memoization:** useMemo, useCallback for expensive operations
- **Bundle Size:** Tree shaking, minification

---

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---


## 👥 Authors

- **Your Name** - *Prashant Chauhan* - [GitHub](https://github.com/psc856)

---

## 🙏 Acknowledgments

- React team for the amazing framework
- AWS for serverless infrastructure
- Lucide for beautiful icons
- Community contributors

---

## 📞 Support

For support, email psc856@gmail.com 

---

**Made with ❤️ using React and AWS**
