# Admin Console UI

A modern, responsive admin console for managing merchants across multiple clusters. Built with React, TypeScript, and Tailwind CSS.

## Features

- **Merchant Management**: View, create, update, and delete merchants
- **Multi-Cluster Support**: Switch between different clusters seamlessly
- **Search & Filter**: Find merchants by name, email, or ID
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Uses context API for state management
- **Error Handling**: Comprehensive error handling and user feedback
- **Form Validation**: Client-side validation with helpful error messages

## Prerequisites

- Node.js 16+ 
- npm or yarn

## Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd admin-console-ui

# Install dependencies
npm install
```

## Environment Setup

Create a `.env` file in the root directory:

```env
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

## API Endpoints Required

The application expects the following API endpoints:

### Clusters
- `GET /api/clusters` - Get all clusters

### Merchants
- `GET /api/merchants` - Get all merchants (supports `?cluster=id` query param)
- `GET /api/merchants/:id` - Get merchant by ID
- `POST /api/merchants` - Create new merchant
- `PUT /api/merchants/:id` - Update merchant
- `DELETE /api/merchants/:id` - Delete merchant
- `GET /api/merchants/search` - Search merchants (supports `?q=query&cluster=id`)
- `GET /api/merchants/export` - Export merchants as CSV/JSON

## API Response Format

All API endpoints should return responses in the following format:

```json
{
  "success": true,
  "data": {...},
  "message": "Optional success message",
  "error": "Optional error message if success is false"
}
```

## Running the Application

### Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm test
```

## Project Structure

```
src/
├── components/           # React components
│   ├── Header.tsx       # Top header bar
│   ├── Sidebar.tsx      # Sidebar navigation
│   ├── MerchantList.tsx # Merchant list table
│   ├── MerchantFormModal.tsx # Add/Edit merchant form
│   └── DeleteConfirmModal.tsx # Delete confirmation
├── context/             # React Context
│   └── MerchantContext.tsx # Global merchant state
├── services/            # API services
│   └── merchantService.ts # Merchant API calls
├── types/               # TypeScript types
│   └── merchant.ts      # Merchant types
├── App.tsx              # Main app component
├── index.tsx            # App entry point
└── index.css            # Global styles
```

## Merchant Data Structure

```typescript
interface Merchant {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  cluster: string;
  createdAt: string;
  updatedAt: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  taxId?: string;
}
```

## Features in Detail

### Cluster Switching
- Switch between different clusters from the sidebar
- Automatically loads merchants for selected cluster
- Visual indicator for active cluster

### Merchant Operations

#### View
- Displays all merchants in a sortable table
- Shows key information: name, email, phone, cluster, status
- Responsive table design

#### Create
- Click "Create New Merchant" button
- Fill in required fields (Name, Email, Phone, Cluster)
- Optional fields: Address, City, State, Country, Tax ID
- Form validation with error messages

#### Edit
- Click edit icon next to merchant
- Modify merchant details
- Update status (Active, Inactive, Suspended)
- Submit to save changes

#### Delete
- Click delete icon next to merchant
- Confirmation modal to prevent accidental deletion
- Permanent removal of merchant record

### Search
- Search by merchant ID
- Real-time search results
- Filter by cluster

## Technologies Used

- **React 18**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **React Icons**: Icon library
- **Axios**: HTTP client
- **React Context API**: State management

## Error Handling

- API error messages displayed to user
- Form validation errors shown inline
- Network error handling with retry options
- Toast/Alert notifications for operations

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT

## Support

For issues or questions, please contact the development team.
