import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await login(form.email, form.password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Email ou mot de passe incorrect';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container glass">
        <div className="auth-header">
          <h2>Bon retour parmi nous !</h2>
          <p>Connectez-vous pour gérer vos trajets et réservations.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <Input 
            label="Adresse email"
            type="email" 
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="vous@exemple.fr" 
            icon={<Mail size={18} />} 
            required
          />
          <Input 
            label="Mot de passe"
            type="password" 
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••" 
            icon={<Lock size={18} />} 
            required
          />
          
          <div className="auth-options">
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" /> Se souvenir de moi
            </label>
            <a href="#" className="text-sm font-medium">Mot de passe oublié ?</a>
          </div>
          
          <Button fullWidth size="lg" className="mt-4" disabled={loading}>
            {loading ? 'Connexion...' : <><LogIn size={18} /> Se connecter</>}
          </Button>
        </form>
        
        <div className="auth-footer">
          <p className="text-muted">
            Pas encore de compte ? <Link to="/register" className="font-semibold text-primary">S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
