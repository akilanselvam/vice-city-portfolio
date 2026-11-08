import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './theme-medieval.css';
import './theme-space.css';
import App from './App.jsx';
import { ThemeProvider, initialTheme } from './theme/ThemeContext.jsx';
import { loadKit } from './world3d/kits.js';

// Start downloading the 3D world and this visitor's theme right away, in parallel with React starting up,
// instead of one after another once the page has rendered
import('./world3d/World3D.jsx');
loadKit(initialTheme()).catch(() => {});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
