import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../utils/userRole';

const roleHomeMap = {
  [UserRole.Admin]: '/admin',
  [UserRole.Mentor]: '/mentor',
  [UserRole.Student]: '/student',
};

/**
 * Normalize a role value (number, string name, or string number) to its numeric UserRole.
 */
const normalizeRole = (role) => {
  if (typeof role === 'number') return role;
  if (typeof role === 'string') {
    const lower = role.toLowerCase();
    if (lower === 'student') return UserRole.Student;
    if (lower === 'mentor') return UserRole.Mentor;
    if (lower === 'admin') return UserRole.Admin;
    const parsed = Number(role);
    if (!isNaN(parsed)) return parsed;
  }
  return -1;
};

/**
 * ProtectedRoute – guards a route by authentication and optionally by role.
 *
 * @param {number|number[]} allowedRoles  - UserRole(s) permitted to access this route.
 *                                          If omitted, any authenticated user is allowed.
 * @param {JSX.Element}     children      - The component(s) to render when access is granted.
 */
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Wait for auth state to resolve before making any redirect decision
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in → redirect to login, preserve the intended destination
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → redirect to their own home
  if (allowedRoles !== undefined && allowedRoles !== null) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const userRole = normalizeRole(user.role);
    if (!roles.includes(userRole)) {
      const home = roleHomeMap[userRole] ?? '/';
      return <Navigate to={home} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
