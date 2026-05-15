import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Car, Search, PlusCircle, User, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isDriver, isAdmin, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [];

  if (isAdmin) {
    navLinks.push({ name: 'Admin', path: '/admin', icon: <PlusCircle size={18} /> });
  } else if (isDriver) {
    navLinks.push({ name: 'Publier', path: '/publish', icon: <PlusCircle size={18} /> });
  } else {
    navLinks.push({ name: 'Rechercher', path: '/search', icon: <Search size={18} /> });
  }

  // Initiales de l'utilisateur
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <nav className="navbar glass">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <Car size={24} color="white" />
          </div>
          <span className="logo-text">TrajetLocal</span>
        </Link>

        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-profile">
                <div className="nav-avatar">{initials}</div>
                <span>{user?.full_name?.split(' ')[0] || 'Profil'}</span>
              </Link>
              <button className="nav-logout" onClick={handleLogout} aria-label="Déconnexion">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-login">Connexion</Link>
              <Link to="/register" className="nav-register">S'inscrire</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
