import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components';
import { LandingPage, DashboardPage, StudyPage, ChatPage } from './pages';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="study" element={<StudyPage />} />
          <Route path="chat" element={<ChatPage />} />
        </Route>
      </Routes>
    </Router>
  </StrictMode>
);