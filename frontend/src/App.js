import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster } from 'sonner';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import KanbanBoard from './pages/KanbanBoard';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import Performance from './pages/Performance';
import Meetings from './pages/Meetings';
import Approvals from './pages/Approvals';
import Highlights from './pages/Highlights';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export { API };

export const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get(`${API}/auth/me`)
        .then(res => {
          setUser(res.data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-xl font-heading">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/app/highlights" /> : <LandingPage />} />
          <Route path="/login" element={user ? <Navigate to="/app/highlights" /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/app/highlights" /> : <Signup />} />
          <Route path="/app" element={user ? <Dashboard /> : <Navigate to="/login" />}>
            <Route path="highlights" element={<Highlights />} />
            <Route path="kanban" element={<KanbanBoard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="team" element={<Team />} />
            <Route path="performance" element={<Performance />} />
            <Route path="meetings" element={<Meetings />} />
            <Route path="approvals" element={<Approvals />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthContext.Provider>
  );
}

import React from 'react';
export default App;