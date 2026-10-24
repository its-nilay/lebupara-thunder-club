import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';

import Dashboard from './pages/Dashboard';
import Standings from './pages/Standings';
import TopScorers from './pages/TopScorers';
import Matches from './pages/Matches';
import Players from './pages/Players';
import Login from './pages/Login';
import Admin from './pages/Admin';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/top-scorers" element={<TopScorers />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/players" element={<Players />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
