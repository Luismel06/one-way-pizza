import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { supabase } from "./supabase/supabase.config";

supabase.auth.getSession().then(({ data, error }) => {
  console.log("🧠 Sesión actual:", data, error);
});


createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
    <App />
    </BrowserRouter>
  </React.StrictMode>,
)
