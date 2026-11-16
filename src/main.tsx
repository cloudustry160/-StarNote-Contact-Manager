import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { ContactsProvider } from './hooks/useContacts';
import { ToastProvider } from './components/toast';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <ToastProvider>
        <ContactsProvider>
          <App />
        </ContactsProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
