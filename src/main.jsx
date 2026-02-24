import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { UIProvider } from './context/UIContext'
import { AuthProvider } from './context/AuthContext'
import { AIChatProvider } from './context/AIChatContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <UIProvider>
            <AIChatProvider>
              <App />
            </AIChatProvider>
          </UIProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
