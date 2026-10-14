import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Votar from './pages/Votar.jsx';
import Placar from './pages/Placar.jsx';
import Revelar from './pages/Revelar.jsx';
import Qr from './pages/Qr.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/votar" replace />} />
        <Route path="/votar" element={<Votar />} />
        <Route path="/placar" element={<Placar />} />
        <Route path="/revelar" element={<Revelar />} />
        <Route path="/qr" element={<Qr />} />
        <Route path="*" element={<Navigate to="/votar" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
