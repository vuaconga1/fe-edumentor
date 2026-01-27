import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppRoutes from './routes/AppRoutes';
import ChangePasswordModal from './components/auth/ChangePasswordModal';
import './App.css';

function App() {
  return (
    <>
      <AppRoutes />
      <ChangePasswordModal />
      <ToastContainer 
        position="top-right" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{
          fontSize: '14px',
        }}
        toastStyle={{
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      />
    </>
  );
}

export default App

