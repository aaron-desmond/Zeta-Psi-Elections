# Zeta Psi Elections - Frontend

React-based frontend for the Fraternity Election Management System.

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)
- Backend server running on http://localhost:5001

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will open at http://localhost:3000 and automatically connect to the backend API.

### Environment Variables

Create a `.env` file in this directory if you need to customize the API URL:

```env
REACT_APP_API_URL=http://localhost:5001/api
```

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

### Features

- User authentication (register/login)
- Position browsing
- Application submission with photo upload
- Live voting interface
- Admin dashboard for election management
- Real-time results visualization

### Project Structure

```
src/
├── components/
│   ├── Admin/          # Admin dashboard components
│   ├── Application/    # Application submission
│   ├── Auth/           # Login/Register
│   ├── Candidates/     # Browse candidates
│   ├── Dashboard/      # User dashboard
│   ├── Layout/         # Navigation
│   ├── Positions/      # Position management
│   └── Voting/         # Voting interface
├── utils/
│   ├── api.js          # API integration
│   └── termCalculator.js
├── data/
│   └── mockData.js
└── App.js              # Main app component
```

## API Integration

The frontend connects to the backend API at `http://localhost:5001/api` by default.

All API calls are handled through the `src/utils/api.js` module which provides:
- Authentication (login, register, get current user)
- Positions CRUD operations
- Application submissions with file uploads
- Election management
- Voting functionality

## Troubleshooting

**Issue:** Cannot connect to backend
- **Solution:** Ensure the backend server is running on port 5001

**Issue:** CORS errors
- **Solution:** Check that the backend .env has `FRONTEND_URL=http://localhost:3000`

**Issue:** npm install fails
- **Solution:** Delete node_modules and package-lock.json, then run `npm install` again
