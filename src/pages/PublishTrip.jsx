import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, Euro, Users, PlusCircle } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Map } from '../components/Map';
import { tripAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './PublishTrip.css';

const PublishTrip = () => {
  const navigate = useNavigate();
  const { isDriver } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    originName: '',
    destinationName: '',
    originLat: 36.8065,
    originLng: 10.1815,
    destinationLat: 36.8165,
    destinationLng: 10.1915,
    departureDate: '',
    departureTime: '',
    totalSeats: 3,
    price: 2.5,
    description: '',
    waypoints: ''
  });

  const [selectionMode, setSelectionMode] = useState('origin'); // 'origin' or 'destination'

  const handleMapClick = async (latlng) => {
    // 1. Mettre à jour les coordonnées
    if (selectionMode === 'origin') {
      setFormData(prev => ({ ...prev, originLat: latlng.lat, originLng: latlng.lng }));
    } else {
      setFormData(prev => ({ ...prev, destinationLat: latlng.lat, destinationLng: latlng.lng }));
    }

    // 2. Chercher le nom de l'adresse (Reverse Geocoding)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await response.json();
      const addressName = data.display_name.split(',')[0] + (data.address.city || data.address.town || '');
      
      if (selectionMode === 'origin') {
        setFormData(prev => ({ ...prev, originName: addressName }));
      } else {
        setFormData(prev => ({ ...prev, destinationName: addressName }));
      }
    } catch (err) {
      console.error('Erreur de géocodage:', err);
    }
  };

  const mapMarkers = [
    { position: [formData.originLat, formData.originLng], popup: 'Départ' },
    { position: [formData.destinationLat, formData.destinationLng], popup: 'Arrivée' }
  ];

  useEffect(() => {
    if (!isDriver) {
      navigate('/dashboard');
    }
  }, [isDriver, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1 && (!formData.originName || !formData.destinationName)) {
      setError('Veuillez remplir les lieux de départ et d\'arrivée');
      return;
    }
    if (step === 2 && (!formData.departureDate || !formData.departureTime)) {
      setError('Veuillez spécifier la date et l\'heure');
      return;
    }
    setError('');
    if (step < 3) setStep(step + 1);
  };

  const handlePublish = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        departureTime: `${formData.departureDate} ${formData.departureTime}:00`
      };
      await tripAPI.publish(payload);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="publish-page container">
      <div className="publish-header text-center">
        <h1>Proposer un trajet</h1>
        <p className="text-muted">Partagez vos frais et réduisez la pollution en covoiturant.</p>
      </div>

      <div className="publish-container glass">
        <div className="publish-steps">
          <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>1. Itinéraire</div>
          <div className="step-line"></div>
          <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>2. Détails</div>
          <div className="step-line"></div>
          <div className={`step-indicator ${step >= 3 ? 'active' : ''}`}>3. Confirmation</div>
        </div>

        {error && <div className="auth-error mb-4">{error}</div>}

        <form className="publish-form" onSubmit={step === 3 ? (e) => { e.preventDefault(); handlePublish(); } : handleNext}>
          {step === 1 && (
            <div className="form-step animate-fade-in">
              <h2 className="mb-4">Quel est votre trajet ?</h2>
              
              <div className="flex gap-2 mb-4">
                <Button 
                  type="button" 
                  variant={selectionMode === 'origin' ? 'primary' : 'outline'}
                  onClick={() => setSelectionMode('origin')}
                  className="flex-1"
                >
                  📍 Placer Départ
                </Button>
                <Button 
                  type="button" 
                  variant={selectionMode === 'destination' ? 'primary' : 'outline'}
                  onClick={() => setSelectionMode('destination')}
                  className="flex-1"
                >
                  🏁 Placer Arrivée
                </Button>
              </div>

              <div className="flex flex-col gap-4">
                <Input 
                  label="Lieu de départ" 
                  name="originName"
                  value={formData.originName}
                  onChange={handleChange}
                  placeholder="Ex: Gare centrale" 
                  icon={<MapPin size={18} />} 
                  required
                />
                <Input 
                  label="Lieu d'arrivée" 
                  name="destinationName"
                  value={formData.destinationName}
                  onChange={handleChange}
                  placeholder="Ex: Campus" 
                  icon={<MapPin size={18} />} 
                  required
                />
                <Input 
                  label="Villes intermédiaires (optionnel)" 
                  name="waypoints"
                  value={formData.waypoints}
                  onChange={handleChange}
                  placeholder="Ex: Hammamet, Nabeul" 
                  icon={<MapPin size={18} className="text-muted" />} 
                />
              </div>
              
              <div className="mt-6 mb-6 map-preview glass">
                <p className="text-sm text-muted mb-2 font-medium">Cliquez sur la carte pour placer les points</p>
                <Map 
                  height="300px" 
                  center={[formData.originLat, formData.originLng]} 
                  zoom={11} 
                  markers={mapMarkers}
                  onMapClick={handleMapClick}
                />
              </div>

              <Button fullWidth size="lg" type="submit">
                Continuer
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="form-step animate-fade-in">
              <h2 className="mb-4">Détails du trajet</h2>
              <div className="grid-2 gap-4">
                <Input 
                  label="Date" 
                  type="date" 
                  name="departureDate"
                  value={formData.departureDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  icon={<Calendar size={18} />} 
                  required
                />
                <Input 
                  label="Heure de départ" 
                  type="time" 
                  name="departureTime"
                  value={formData.departureTime}
                  onChange={handleChange}
                  icon={<Clock size={18} />} 
                  required
                />
              </div>
              
              <div className="grid-2 gap-4 mt-4">
                <Input 
                  label="Places disponibles" 
                  type="number" 
                  name="totalSeats"
                  min="1" max="8" 
                  value={formData.totalSeats}
                  onChange={handleChange}
                  icon={<Users size={18} />} 
                  required
                />
                <Input 
                  label="Prix par place (DT)" 
                  type="number" 
                  name="price"
                  step="0.5" min="0" 
                  value={formData.price}
                  onChange={handleChange}
                  icon={<Euro size={18} />} 
                  required
                />
              </div>

              <div className="mt-4">
                <label className="input-label">Informations complémentaires</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field mt-2" 
                  rows="3" 
                  placeholder="Bagages acceptés, retards possibles, etc."
                ></textarea>
              </div>

              <div className="flex gap-4 mt-6">
                <Button variant="outline" fullWidth type="button" onClick={() => { setError(''); setStep(1); }}>Retour</Button>
                <Button fullWidth size="lg" type="submit">Suivant</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-step text-center animate-fade-in">
              <div className="success-icon mb-4 mx-auto">
                <PlusCircle size={48} className="text-primary" />
              </div>
              <h2 className="mb-2">Trajet prêt à être publié !</h2>
              <p className="text-muted mb-6">Récapitulatif de votre proposition de covoiturage.</p>
              
              <div className="summary-card glass mb-6 text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-muted">Trajet</span>
                  <span className="font-semibold">{formData.originName} → {formData.destinationName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted">Date & Heure</span>
                  <span className="font-semibold">{formData.departureDate} à {formData.departureTime}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted">Places</span>
                  <span className="font-semibold">{formData.totalSeats} places</span>
                </div>
                <div className="flex justify-between font-bold text-primary text-lg mt-4 pt-4 border-t">
                  <span>Gain potentiel</span>
                  <span>{(formData.price * formData.totalSeats).toFixed(2)} DT</span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" fullWidth type="button" onClick={() => { setError(''); setStep(2); }}>Modifier</Button>
                <Button fullWidth size="lg" type="button" onClick={handlePublish} disabled={loading}>
                  {loading ? 'Publication...' : 'Publier mon trajet'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PublishTrip;
