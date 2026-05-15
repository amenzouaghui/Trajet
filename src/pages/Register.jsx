import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, Car, Phone, ChevronRight, ChevronLeft } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { CameraCapture } from '../components/CameraCapture';
import { useAuth } from '../context/AuthContext';
import { VEHICLE_MAKES, MAKE_NAMES, COLORS } from '../data/vehicles';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: '',
    fullName: '',
    email: '',
    password: '',
    phone: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleColor: '',
    plateNumber: '',
    avatar: null
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [fieldSuccess, setFieldSuccess] = useState({});
  const [touched, setTouched] = useState({});

  // Modèles disponibles selon la marque sélectionnée
  const availableModels = formData.vehicleMake ? (VEHICLE_MAKES[formData.vehicleMake] || []) : [];

  const validateField = async (name, value) => {
    let error = '';
    let success = '';

    if (name === 'fullName') {
      if (value.length < 3 || !/^[a-zA-ZÀ-ÿ\s]+$/.test(value)) {
        error = 'Le nom doit contenir au moins 3 lettres';
      } else {
        success = true;
      }
    }

    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        error = 'Veuillez entrer une adresse email valide';
      } else {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const response = await fetch(`${API_URL}/auth/check-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: value })
          });
          const data = await response.json();
          if (!data.available) {
            error = 'Cette adresse email est déjà utilisée';
          } else {
            success = 'Email disponible ✓';
          }
        } catch (err) {
          console.error('Erreur check email:', err);
          error = 'Impossible de vérifier l\'email. Veuillez réessayer.';
        }
      }
    }

    if (name === 'phone') {
      if (!/^[234579]\d{7}$/.test(value)) {
        error = 'Numéro tunisien invalide (ex: 55 123 456)';
      } else {
        success = true;
      }
    }

    if (name === 'password') {
      if (value.length < 8 || !/[A-Z]/.test(value) || !/\d/.test(value)) {
        error = 'Le mot de passe doit contenir 8 caractères minimum avec une majuscule et un chiffre';
      } else {
        success = true;
      }
    }

    setFieldErrors(prev => ({ ...prev, [name]: error }));
    setFieldSuccess(prev => ({ ...prev, [name]: success }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Reset model when make changes
      if (name === 'vehicleMake') updated.vehicleModel = '';
      return updated;
    });
    if (touched[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
      setFieldSuccess(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoCapture = (dataUrl) => {
    setFormData(prev => ({ ...prev, avatar: dataUrl }));
  };

  const selectRole = (role) => {
    setFormData(prev => ({ ...prev, role }));
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 2 && formData.role === 'driver') {
      setStep(3); // Infos véhicule
      return;
    }
    if (step === 3 && formData.role === 'driver') {
      setStep(4); // Photo
      return;
    }
    await completeRegistration();
  };

  const completeRegistration = async () => {
    if (formData.role === 'driver' && !formData.avatar) {
      setError('La photo de profil est obligatoire pour les conducteurs.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'inscription';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container glass">
        <div className="auth-header">
          <h2>Rejoignez TrajetLocal</h2>
          <p>
            {step === 1 && "Choisissez votre rôle pour commencer."}
            {step === 2 && "Parlez-nous un peu de vous."}
            {step === 3 && "Informations sur votre véhicule."}
            {step === 4 && "Prenez une photo pour votre profil."}
          </p>
        </div>

        <div className="auth-steps-indicator mb-6">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}></div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step-dot ${step >= 3 ? 'active' : ''}`}></div>
          {formData.role === 'driver' && (
            <>
              <div className={`step-line ${step >= 4 ? 'active' : ''}`}></div>
              <div className={`step-dot ${step >= 4 ? 'active' : ''}`}></div>
            </>
          )}
        </div>

        {error && <div className="auth-error">{error}</div>}

        {step === 1 && (
          <div className="role-selection grid-2 gap-4 animate-fade-in">
            <button
              className={`role-card glass ${formData.role === 'passenger' ? 'active' : ''}`}
              onClick={() => selectRole('passenger')}
            >
              <div className="role-icon"><User size={40} /></div>
              <h3>Passager</h3>
              <p>Je cherche des trajets pour me déplacer.</p>
            </button>
            <button
              className={`role-card glass ${formData.role === 'driver' ? 'active' : ''}`}
              onClick={() => selectRole('driver')}
            >
              <div className="role-icon"><Car size={40} /></div>
              <h3>Conducteur</h3>
              <p>Je propose des trajets et je peux aussi en réserver.</p>
            </button>
          </div>
        )}

        {(step === 2 || step === 3 || step === 4) && (
          <form className="auth-form animate-fade-in" onSubmit={handleSubmit}>
            {step === 2 && (
              <>
                <Input label="Nom complet" name="fullName" value={formData.fullName}
                  onChange={handleInputChange} onBlur={handleBlur} placeholder="Jean Dupont"
                  icon={<User size={18} />} required 
                  error={touched.fullName && fieldErrors.fullName}
                  success={touched.fullName && fieldSuccess.fullName} />
                <Input label="Adresse email" type="email" name="email" value={formData.email}
                  onChange={handleInputChange} onBlur={handleBlur} placeholder="vous@exemple.fr"
                  icon={<Mail size={18} />} required
                  error={touched.email && fieldErrors.email}
                  success={touched.email && fieldSuccess.email} />
                <Input label="Téléphone" type="tel" name="phone" value={formData.phone}
                  onChange={handleInputChange} onBlur={handleBlur} placeholder="55 123 456"
                  icon={<Phone size={18} />} required
                  error={touched.phone && fieldErrors.phone}
                  success={touched.phone && fieldSuccess.phone} />
                <Input label="Mot de passe" type="password" name="password" value={formData.password}
                  onChange={handleInputChange} onBlur={handleBlur} placeholder="Au moins 8 caractères"
                  icon={<Lock size={18} />} required
                  error={touched.password && fieldErrors.password}
                  success={touched.password && fieldSuccess.password} />
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid-2 gap-4">
                  {/* MARQUE — liste déroulante */}
                  <div className="input-group">
                    <label className="input-label">Marque</label>
                    <select
                      name="vehicleMake"
                      value={formData.vehicleMake}
                      onChange={handleInputChange}
                      required
                      className="input-field mt-1"
                    >
                      <option value="">-- Choisir une marque --</option>
                      {MAKE_NAMES.map(make => (
                        <option key={make} value={make}>{make}</option>
                      ))}
                    </select>
                  </div>

                  {/* MODÈLE — dépend de la marque */}
                  <div className="input-group">
                    <label className="input-label">Modèle</label>
                    <select
                      name="vehicleModel"
                      value={formData.vehicleModel}
                      onChange={handleInputChange}
                      required
                      disabled={!formData.vehicleMake}
                      className="input-field mt-1"
                    >
                      <option value="">
                        {formData.vehicleMake ? '-- Choisir un modèle --' : '-- Choisir une marque d\'abord --'}
                      </option>
                      {availableModels.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-2 gap-4">
                  {/* COULEUR — liste avec émojis */}
                  <div className="input-group">
                    <label className="input-label">Couleur</label>
                    <select
                      name="vehicleColor"
                      value={formData.vehicleColor}
                      onChange={handleInputChange}
                      required
                      className="input-field mt-1"
                    >
                      <option value="">-- Choisir une couleur --</option>
                      {COLORS.map(color => (
                        <option key={color.value} value={color.value}>{color.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* PLAQUE — toujours libre */}
                  <Input
                    label="Plaque d'immatriculation"
                    name="plateNumber"
                    value={formData.plateNumber}
                    onChange={handleInputChange}
                    placeholder="Ex: 123 TUN 4567"
                    required
                  />
                </div>
              </>
            )}

            {step === 4 && (
              <CameraCapture onCapture={handlePhotoCapture} />
            )}

            <div className="flex gap-4 mt-6">
              <Button type="button" variant="outline" fullWidth onClick={() => setStep(step - 1)}>
                <ChevronLeft size={18} /> Retour
              </Button>
              <Button type="submit" fullWidth disabled={loading || (step === 2 && (!fieldSuccess.fullName || !fieldSuccess.email || !fieldSuccess.phone || !fieldSuccess.password))}>
                {loading ? 'Création...' : (step === 2 || step === 3) && formData.role === 'driver' ? (
                  <>Continuer <ChevronRight size={18} /></>
                ) : (
                  <><UserPlus size={18} /> Créer mon compte</>
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="auth-footer mt-6">
          <p className="text-muted">
            Déjà un compte ? <Link to="/login" className="font-semibold text-primary">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
