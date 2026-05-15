import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Search, Leaf, Shield, Heart, Calendar } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    origin: '',
    destination: '',
    date: ''
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchData.origin) params.append('origin', searchData.origin);
    if (searchData.destination) params.append('destination', searchData.destination);
    if (searchData.date) params.append('date', searchData.date);
    
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Partagez vos trajets, <span className="text-gradient">créez des liens</span>
            </h1>
            <p className="hero-subtitle">
              L'application de covoiturage local qui connecte les habitants de votre ville. 
              Économisez, réduisez la pollution et rencontrez vos voisins.
            </p>
            
            <div className="hero-search-box glass">
              <div className="search-inputs">
                <Input 
                  placeholder="Départ (ex: Tunis)" 
                  icon={<MapPin size={18} />} 
                  className="search-input"
                  value={searchData.origin}
                  onChange={(e) => setSearchData({...searchData, origin: e.target.value})}
                />
                <Input 
                  placeholder="Arrivée (ex: Monastir)" 
                  icon={<MapPin size={18} />} 
                  className="search-input"
                  value={searchData.destination}
                  onChange={(e) => setSearchData({...searchData, destination: e.target.value})}
                />
                <Input 
                  type="date"
                  placeholder="Date" 
                  icon={<Calendar size={18} />} 
                  className="search-input"
                  value={searchData.date}
                  onChange={(e) => setSearchData({...searchData, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <Button variant="primary" size="lg" className="search-btn" onClick={handleSearch}>
                <Search size={18} /> Rechercher
              </Button>
            </div>
            
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">+500</span>
                <span className="stat-label">Trajets/mois</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">1.2t</span>
                <span className="stat-label">CO2 évité</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">4.8/5</span>
                <span className="stat-label">Avis moyen</span>
              </div>
            </div>
          </div>
          
          <div className="hero-image-wrapper">
            <div className="hero-graphic">
              {/* Abstract illustration with CSS/Icons */}
              <div className="graphic-circle circle-1"></div>
              <div className="graphic-circle circle-2"></div>
              <div className="graphic-card card-1 glass">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">AM</div>
                  <div>
                    <div className="font-semibold text-sm">Amen M.</div>
                    <div className="text-xs text-muted">Conducteur • 4.9 ★</div>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Gare Centre</span>
                  <span className="text-primary font-bold">2,50 </span>
                </div>
              </div>
              <div className="graphic-card card-2 glass">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-xs">LC</div>
                  <div>
                    <div className="font-semibold text-sm">Lucie C.</div>
                    <div className="text-xs text-muted">Conductrice • 5.0 ★</div>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Zone Indust.</span>
                  <span className="text-primary font-bold">1,80 </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section container mt-8 mb-8">
        <h2 className="section-title text-center mb-6">Pourquoi choisir TrajetLocal ?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon bg-primary-light text-primary">
              <Leaf size={24} />
            </div>
            <h3>Écologique</h3>
            <p>Moins de voitures sur la route, c'est moins de pollution et de bouchons dans notre ville.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon bg-secondary-light text-secondary">
              <Heart size={24} />
            </div>
            <h3>Lien Social</h3>
            <p>Ne voyagez plus seul. Rencontrez des personnes qui vivent et travaillent près de chez vous.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon bg-accent-light text-accent" style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent)' }}>
              <Shield size={24} />
            </div>
            <h3>Sécurisé</h3>
            <p>Profils vérifiés et système d'avis pour voyager en toute tranquillité.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
