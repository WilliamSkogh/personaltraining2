import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../sass/index.scss';
import './dark-mode.css';
import App from './App';

createRoot(document.querySelector('#root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);