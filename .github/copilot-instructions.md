# Copilot Instructions for MentorEdu Frontend

## Project Overview
- **MentorEdu Frontend** is a React + Vite SPA for a mentorship platform.
- Uses Tailwind CSS for styling, React Router for navigation, and Axios for API calls.
- Communicates with a backend API (default: `https://localhost:7082`) via REST endpoints.
- All API clients are in `src/api/` and use a shared Axios instance with token interceptors.

## Key Structure & Patterns
- **src/components/**: Reusable UI components, organized by feature (e.g., `messaging/`, `admin/`, `mentor/`).
- **src/pages/**: Top-level route pages, often composed of feature components.
- **src/api/**: API modules (e.g., `adminApi.js`, `mentorApi.js`) encapsulate all backend calls. Use these for all data access.
- **src/context/**: React Contexts for global state (e.g., theme, UI state).
- **src/mock/**: Mock data for development/testing (not used in production).
- **src/utils/**: Utility functions (e.g., avatar URL normalization).

## Developer Workflows
- **Install dependencies:** `npm install`
- **Start dev server:** `npm run dev` (runs on http://localhost:5173)
- **Build for production:** `npm run build` (output: `dist/`)
- **Lint code:** `npm run lint`
- **Preview production build:** `npm run preview`
- **Environment config:** Set `VITE_API_BASE_URL` in `.env` (default: `https://localhost:7082`).

## API & Data Flow
- All API calls go through `src/api/axios.js` (or similar) for token handling.
- Use the provided API modules (e.g., `communityApi`, `mentorApi`)—do not call `fetch` or `axios` directly in components.
- Data is fetched in `useEffect` hooks in pages/components, then passed down as props.
- Mock data in `src/mock/` is used for local development only.

## UI & Styling
- Tailwind CSS is configured via `tailwind.config.js` and used throughout all components.
- Use utility classes for layout and theming; avoid custom CSS unless necessary.
- Dark mode is supported via Tailwind's `dark:` classes.

## Conventions & Patterns
- **Component organization:** Grouped by feature, not by type.
- **API enums:** Some API modules map string roles to backend enum numbers (see `adminApi.js`).
- **Error handling:** Prefer extracting backend error messages (see `extractServerMessage` in `ChangePassword.jsx`).
- **Pagination/filtering:** Handled in API modules and passed as params (see `getUsers`, `getPosts`).
- **File uploads:** Use `fileApi` with correct form keys as per backend Swagger docs.

## Integration Points
- **SignalR:** Real-time messaging via `@microsoft/signalr` (see `src/signalr/`).
- **Icons:** Uses `react-icons` and `lucide-react` for UI icons.
- **Routing:** All routes defined in `src/routes/AppRoutes.jsx`.

## Examples
- To fetch paginated users: `adminApi.getUsers({ pageNumber, pageSize, role })`
- To upload a chat image: `fileApi.uploadChatImage(file)`
- To display a modal: Use modal components in `components/admin/` or `components/messaging/`

## Do/Don't
- **Do**: Use API modules for all backend access, follow feature-based component organization, use Tailwind for styling.
- **Don't**: Hardcode API URLs, bypass API modules, or add new ports.

For more, see [README.md](../../README.md) and `src/api/` for API usage patterns.
