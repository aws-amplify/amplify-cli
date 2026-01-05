import { Amplify } from 'aws-amplify';
import amplifyconfig from './amplifyconfiguration.json';
Amplify.configure(amplifyconfig);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
