# BuildPro Frontend

**Open-source construction management platform UI**

BuildPro is a full-featured construction management system designed to help construction teams manage projects, documents, RFIs, drawings, photos, daily logs, punch lists, and financials—all in one place.

## Features

- **Dashboard** - Project overview and quick stats
- **Documents** - Upload, view, and manage project documents
- **RFIs** - Create and track Requests for Information with responses
- **Drawings** - View drawing sets, sheets, and annotate PDFs with markups
- **Photos** - Organize photos in albums with tags and search
- **Submittals** - Manage submittal packages and review workflows
- **Daily Logs** - Record daily site activities, weather, and work performed
- **Punch List** - Track deficiencies through completion and verification
- **Financials** - Manage budgets, commitments, and change orders
- **Team** - View and manage project team members

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Create React App
- **Styling**: Tailwind CSS (via inline classes)
- **Icons**: Lucide React
- **PDF Rendering**: PDF.js (loaded from CDN)

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- BuildPro Backend running (see [backend repo](https://github.com/amrishkapoor-tt/buildpro-backend))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/amrishkapoor-tt/buildpro-frontend.git
   cd buildpro-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API URL**
   
   Edit `src/App.js` and update the API_URL constant:
   ```javascript
   const API_URL = 'http://localhost:3001/api/v1';  // For local development
   ```
   
   Also update the API_URL in each component file in `src/components/`.

4. **Start the development server**
   ```bash
   npm start
   ```

The app will be available at `http://localhost:3000`.

## Project Structure

```
buildpro-frontend/
├── public/
│   ├── index.html        # HTML template
│   └── favicon.ico       # App icon
├── src/
│   ├── App.js            # Main application component
│   ├── index.js          # React entry point
│   ├── index.css         # Global styles
│   └── components/       # Feature modules
│       ├── DailyLogs.jsx
│       ├── Documents.jsx
│       ├── Drawings.jsx
│       ├── Financials.jsx
│       ├── Photos.jsx
│       ├── PunchList.jsx
│       ├── RFIs.jsx
│       ├── Submittals.jsx
│       └── Team.jsx
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## Component Overview

### App.js

The main application shell that handles:
- User authentication (login/register)
- Project selection and creation
- Navigation sidebar
- Routing between modules

### Components

Each component is a self-contained module:

| Component | File | Description |
|-----------|------|-------------|
| **Documents** | `Documents.jsx` | File upload and document list |
| **RFIs** | `RFIs.jsx` | RFI creation, listing, responses, status workflow |
| **Drawings** | `Drawings.jsx` | Drawing sets, sheets, PDF viewer with markup tools |
| **Photos** | `Photos.jsx` | Photo albums, upload, tagging, search |
| **Submittals** | `Submittals.jsx` | Submittal packages and items |
| **DailyLogs** | `DailyLogs.jsx` | Daily reports with weather and activities |
| **PunchList** | `PunchList.jsx` | Punch items with status progression |
| **Financials** | `Financials.jsx` | Budget, commitments, change orders |
| **Team** | `Team.jsx` | Project member list |

### Component Structure

Each component follows this pattern:

```javascript
import React, { useState, useEffect } from 'react';
import { Icon1, Icon2 } from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const ComponentName = ({ projectId, token }) => {
  // State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // API helper
  const apiCall = async (endpoint, options = {}) => { /* ... */ };
  
  // Load data on mount
  useEffect(() => {
    if (projectId) loadData();
  }, [projectId]);
  
  // Data fetching functions
  const loadData = async () => { /* ... */ };
  
  // Event handlers
  const handleCreate = async () => { /* ... */ };
  
  // Render
  return (
    <div>
      {/* Component UI */}
    </div>
  );
};

export default ComponentName;
```

## Key Features

### PDF Viewer with Markup (Drawings.jsx)

The drawing viewer includes:
- PDF rendering using PDF.js
- Markup tools: rectangle, circle, arrow, text
- Zoom controls
- Multi-page navigation
- Persistent markup storage

### Authentication Flow

1. User registers or logs in via `App.js`
2. JWT token stored in localStorage
3. Token passed to all components as `token` prop
4. Components include token in API requests

### API Communication

All components use a shared pattern for API calls:

```javascript
const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
      ...options.headers
    }
  });
  if (!response.ok) throw new Error('Request failed');
  return response.json();
};
```

## Contributing

We welcome contributions! Here's how to get started:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style

- Use functional components with hooks
- Use async/await for API calls
- Handle loading and error states
- Follow existing component patterns
- Use Tailwind utility classes for styling

### Adding a New Module

1. **Create component file** in `src/components/YourModule.jsx`
2. **Follow the existing pattern**:
   ```javascript
   import React, { useState, useEffect } from 'react';
   import { Plus, X } from 'lucide-react';
   
   const API_URL = 'https://buildpro-api.onrender.com/api/v1';
   
   const YourModule = ({ projectId, token }) => {
     const [items, setItems] = useState([]);
     const [loading, setLoading] = useState(false);
     
     const apiCall = async (endpoint, options = {}) => {
       const response = await fetch(`${API_URL}${endpoint}`, {
         ...options,
         headers: {
           'Authorization': `Bearer ${token}`,
           ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
         }
       });
       if (!response.ok) throw new Error('Request failed');
       return response.json();
     };
     
     useEffect(() => {
       if (projectId) loadItems();
     }, [projectId]);
     
     const loadItems = async () => {
       setLoading(true);
       try {
         const data = await apiCall(`/projects/${projectId}/your-items`);
         setItems(data.items || []);
       } catch (error) {
         console.error('Failed to load:', error);
       } finally {
         setLoading(false);
       }
     };
     
     return (
       <div className="space-y-6">
         <h2 className="text-2xl font-semibold text-gray-900">Your Module</h2>
         {/* Your UI */}
       </div>
     );
   };
   
   export default YourModule;
   ```

3. **Import and add route** in `App.js`:
   ```javascript
   import YourModule from './components/YourModule';
   
   // Add to nav items array
   { id: 'yourmodule', icon: YourIcon, label: 'Your Module' }
   
   // Add to render section
   {currentView === 'yourmodule' && <YourModule projectId={selectedProject.id} token={token} />}
   ```

4. **Add backend endpoints** in the backend repo

### Reporting Issues

Please use GitHub Issues to report bugs or request features. Include:
- Description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS details
- Screenshots if applicable

## Building for Production

```bash
npm run build
```

This creates an optimized build in the `build/` folder.

## Deployment

### Render (Static Site)

1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set publish directory: `build`
5. Deploy

### Netlify

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Deploy

### Environment Configuration

Before deploying, update the `API_URL` in all component files to point to your production backend URL.

**Tip**: Consider moving `API_URL` to an environment variable:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
```

Then set `REACT_APP_API_URL` in your deployment environment.

## Known Limitations

- **API URL Hardcoded**: Each component has its own `API_URL` constant. Consider centralizing this.
- **No Offline Support**: Requires active internet connection
- **No Real-time Updates**: Must refresh to see changes from other users

## Future Improvements

- [ ] Centralize API configuration
- [ ] Add environment variable support
- [ ] Implement real-time updates with WebSockets
- [ ] Add offline support with service workers
- [ ] Add unit and integration tests
- [ ] Improve mobile responsiveness
- [ ] Add dark mode support

## License

MIT License - see LICENSE file for details.

## Links

- **Backend Repository**: [buildpro-backend](https://github.com/amrishkapoor-tt/buildpro-backend)
- **Live Demo**: [buildpro.onrender.com](https://buildpro.onrender.com)