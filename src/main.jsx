import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
// Development helper: patch three.js to log & sanitize problematic geometries
import './three-dev-patch';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
