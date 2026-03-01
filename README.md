# MentorEdu Frontend

React + Vite application for MentorEdu platform.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Running the Application

```bash
npm run dev
```

The application will start on: **http://localhost:5173**

## Port Configuration

⚠️ **Important**: This application uses **ONLY TWO PORTS**:

- **Frontend**: `http://localhost:5173` (Vite dev server)
- **Backend API**: `https://localhost:7082` (configured in `.env`)

**DO NOT open additional ports.**

### Environment Configuration

File: `.env`

```env
VITE_API_BASE_URL=https://localhost:7082
```

## Project Structure

```
my-app/
├── src/
│   ├── api/           # API client functions
│   ├── components/    # React components
│   ├── pages/         # Page components
│   ├── routes/        # Route configuration
│   ├── context/       # React Context providers
│   ├── hooks/         # Custom hooks
│   └── utils/         # Utility functions
├── public/            # Static assets
└── .env               # Environment variables
```

## Build for Production

```bash
npm run build
```

Output will be in `dist/` folder.

---

## Original Vite Template Info

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

