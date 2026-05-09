import React from 'react';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            borderRadius: '8px',
            border: '1px solid #E3E1DA',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          },
          success: {
            iconTheme: { primary: '#3B6D11', secondary: '#fff' },
            style: { background: '#EAF3DE', color: '#3B6D11', borderColor: '#B5D98C' },
          },
          error: {
            iconTheme: { primary: '#A32D2D', secondary: '#fff' },
            style: { background: '#FCEBEB', color: '#A32D2D', borderColor: '#F0B8B8' },
          },
        }}
      />
    </>
  );
}
