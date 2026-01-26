# Zeta Psi Elections

A modern, secure election management system designed for fraternity chapters. Built to handle multi-round voting with real-time results and complete transparency.

![Landing Page](screenshots/Landing.png)

## Overview

Zeta Psi Elections streamlines the executive election process for fraternity chapters by providing a comprehensive platform for position management, candidate applications, and secure voting with live result tracking.

## Key Features

### Election Management
- **Multi-Round Voting System** - Automatic runoff elections when no candidate reaches the 2/3 majority threshold
- **Real-Time Results** - Live vote counting with percentage breakdowns and threshold indicators
- **Winner Exclusion** - Previous round winners are automatically excluded from subsequent rounds

### User Experience
- **Easy Applications** - Members submit applications with photos and candidate statements
- **Secure Authentication** - JWT-based authentication with bcrypt password hashing
- **Admin Dashboard** - Centralized control panel for managing positions and elections
- **Responsive Design** - Fully responsive interface optimized for desktop and mobile

### Technical Features
- **PostgreSQL Database** - Robust relational database with proper foreign key constraints
- **RESTful API** - Clean API architecture with Express.js
- **File Upload Support** - Photo uploads for candidate applications (optional)
- **Real-Time Updates** - Live election results during voting

![Dashboard](screenshots/dashboard.png)

## Technology Stack

### Frontend
- **React** 18.x - UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API requests
- **CSS3** - Custom styling with animations

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **PostgreSQL** - Primary database
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Multer** - File upload handling

### Deployment
- **Netlify** - Frontend hosting
- **Render** - Backend hosting with PostgreSQL database
- **Free Tier** - $0/month hosting costs

![Admin Dashboard](screenshots/admin_dashboard.png)

## Prerequisites

- Node.js 16.x or higher
- npm or yarn
- PostgreSQL 12.x or higher (for local development)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/aaron-desmond/zeta-psi-elections.git
cd zeta-psi-elections
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
```

Configure your `.env` file:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/elections
JWT_SECRET=your-super-secret-jwt-key-change-this
FRONTEND_URL=http://localhost:3000
```

Initialize the database:

```bash
node utils/initDatabase.js
```

Start the backend server:

```bash
npm start
```

### 3. Frontend Setup

```bash
cd frontend-setup
npm install

# Create .env file
cp .env.example .env
```

Configure your `.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start the development server:

```bash
npm start
```

The application will open at `http://localhost:3000`

![Voting Interface](screenshots/voting.png)

## Deployment

### Backend (Render)

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure build settings:
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
4. Create a PostgreSQL database on Render
5. Add environment variables:
   ```
   NODE_ENV=production
   DATABASE_URL=<from Render PostgreSQL>
   JWT_SECRET=<generate random string>
   FRONTEND_URL=<your Netlify URL>
   ```

### Frontend (Netlify)

1. Create a new site on [Netlify](https://netlify.com)
2. Connect your GitHub repository
3. Configure build settings:
   - **Base Directory:** `frontend-setup`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `frontend-setup/build`
4. Add environment variable:
   ```
   REACT_APP_API_URL=<your Render backend URL>/api
   ```

### Custom Domain (Optional)

1. Purchase domain through Cloudflare or your preferred registrar
2. Configure DNS records in Cloudflare:
   - A record: `@` → Netlify IP
   - CNAME: `www` → your-site.netlify.app
3. Enable SSL certificate in Netlify (automatic)

![Live Results](screenshots/final_results_multi.png)

## Usage

### For Members

1. **Register** - Create an account with your email
2. **Apply** - Submit applications for open positions with a photo and statement
3. **Vote** - Cast your vote when elections are active
4. **View Results** - Watch live results during active elections

### For Admins

1. **Manage Positions** - Create and edit executive positions
2. **Start Elections** - Begin voting for each position
3. **Monitor Results** - View live vote counts and percentages
4. **Declare Winners** - End elections when a candidate reaches 2/3 majority
5. **Reset System** - Clear all election data at the end of the season

![Candidate Applications](screenshots/application.png)

## Security Features

- **Password Hashing** - Bcrypt with salt rounds
- **JWT Authentication** - Secure token-based sessions
- **Protected Routes** - Middleware-based route protection
- **Admin Authorization** - Role-based access control
- **SQL Injection Prevention** - Parameterized queries
- **CORS Configuration** - Restricted cross-origin requests

## Database Schema

### Core Tables

- **users** - User accounts with authentication
- **positions** - Executive positions available for election
- **applications** - Candidate applications with statements
- **elections** - Active elections with round tracking
- **votes** - Individual votes cast by members
- **winners** - Election winners by round

### Key Relationships

- One election per position
- Multiple applications per position
- One vote per user per round
- Multiple rounds per election
- Winner exclusion across rounds

## Screenshots

### Landing Page
![Landing Page Full](screenshots/landing-full.png)

### Member Dashboard
![Member Dashboard](screenshots/dashboard.png)

### Position Management
![Position Management](screenshots/position_management.png)

### Application Form
![Application Form](screenshots/application.png)

### Voting Interface
![Voting](screenshots/voting.png)

### Results Dashboard
![Results](screenshots/live_results.png)

## Configuration

### Environment Variables

#### Backend
| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `JWT_SECRET` | Secret key for JWT signing | `random-string-here` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://yourdomain.com` |

#### Frontend
| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API endpoint | `https://api.yourdomain.com/api` |

### Admin Account Setup

After deployment, create an admin account:

1. Register a regular account through the UI
2. Connect to your PostgreSQL database
3. Run: `UPDATE users SET is_admin = 1 WHERE email = 'admin@example.com';`
4. Log out and back in to see admin features

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for Zeta Psi fraternity chapters
- Designed to facilitate transparent, democratic elections
- Inspired by the need for modern, accessible voting systems

## Contact

**Project Maintainer:** Your Name

- Email: adesmond2024@gmail.com
- GitHub: [@aaron-desmond](https://github.com/aaron-desmond)

## Future Enhancements

- [ ] Chapter system for multi-organization support
- [ ] Email notifications for election events
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Cloudflare R2 integration for persistent photo storage
- [ ] Automated backup system
- [ ] Export election results to PDF

---

**Built for Zeta Psi - Psi Epsilon Chapter***