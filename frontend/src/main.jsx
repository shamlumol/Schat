import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

// Set global axios base URL for production deployments
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || '';

// Apply persisted theme on load
if (localStorage.getItem('nova_theme') === 'light') {
  document.documentElement.classList.remove('dark')
} else {
  document.documentElement.classList.add('dark')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
