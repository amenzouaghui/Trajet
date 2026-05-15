import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Calendar, Clock, Filter, Users, Star } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { TripCard } from '../components/TripCard';
import { Map } from '../components/Map';
import { tripAPI, bookingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './SearchTrips.css';

const SearchTrips = () => {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState('');
  const [bookingMsg, setBookingMsg] = useState('');

  const [filters, setFilters] = useState({
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('destination') || '',
    date: searchParams.get('date') || '',
  });

  const handleSearch = useCallback(async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const { data } = await tripAPI.search(filters);
      setTrips(data);
    } catch (err) {
      setError('Erreur lors de la recherche.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (searchParams.get('origin') || searchParams.get('destination') || searchParams.get('date')) {
      handleSearch();
    }
  }, []);

  const [selectionMode, setSelectionMode] = useState('origin'); // 'origin' or 'destination'
  const [searchOrigin, setSearchOrigin] = useState(null);
  const [searchDestination, setSearchDestination] = useState(null);

  const handleMapClick = async (latlng) => {
    try {
      if (selectionMode === 'origin') {
        setSearchOrigin([latlng.lat, latlng.lng]);
      } else {
        setSearchDestination([latlng.lat, latlng.lng]);
      }

      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await response.json();
      const addressName = data.display_name.split(',')[0];
      
      setFilters(prev => ({ ...prev, [selectionMode]: addressName }));
    } catch (err) {
      console.error('Erreur de géocodage:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };



  const handleBook = async (tripId) => {
    if (!isAuthenticated) {
      setBookingMsg('Vous devez être connecté pour réserver un trajet.');
      return;
    }
    try {
      await bookingAPI.create(tripId, 1);
      setBookingMsg('Réservation effectuée avec succès !');
      // Rafraîchir les résultats
      const { data } = await tripAPI.search(filters);
      setTrips(data);
    } catch (err) {
      setBookingMsg(err.response?.data?.message || 'Erreur lors de la réservation.');
    }
    setTimeout(() => setBookingMsg(''), 4000);
  };

  // Marqueurs pour les résultats de recherche + points de recherche du passager
  const mapMarkers = [
    ...(searchOrigin ? [{ position: searchOrigin, popup: 'Votre Départ' }] : []),
    ...(searchDestination ? [{ position: searchDestination, popup: 'Votre Destination' }] : []),
    ...trips.map(trip => ({
      position: [parseFloat(trip.origin_lat), parseFloat(trip.origin_lng)],
      popup: `${trip.driver_name} — ${trip.origin_name} → ${trip.destination_name} (${trip.price} DT)`
    }))
  ];

  return (
    <div className="search-page container">
      <div className="search-header">
        <h1>Où allez-vous aujourd'hui ?</h1>
      </div>

      {bookingMsg && (
        <div className={`auth-${bookingMsg.includes('succès') ? 'success' : 'error'} mb-4`}>
          {bookingMsg}
        </div>
      )}

      <div className="search-layout">
        <aside className="search-sidebar">
          <form className="search-form glass" onSubmit={handleSearch}>
            <div className="flex gap-2 mb-4">
              <Button 
                type="button" 
                variant={selectionMode === 'origin' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectionMode('origin')}
                className="flex-1"
              >
                📍 Départ
              </Button>
              <Button 
                type="button" 
                variant={selectionMode === 'destination' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectionMode('destination')}
                className="flex-1"
              >
                🏁 Dest.
              </Button>
            </div>
            <div className="form-group">
              <Input
                name="origin"
                placeholder="Lieu de départ"
                value={filters.origin}
                onChange={handleFilterChange}
                icon={<MapPin size={18} />}
              />
            </div>
            <div className="form-group">
              <Input
                name="destination"
                placeholder="Destination"
                value={filters.destination}
                onChange={handleFilterChange}
                icon={<MapPin size={18} />}
              />
            </div>
            <div className="form-row">
              <Input
                name="date"
                type="date"
                value={filters.date}
                onChange={handleFilterChange}
                min={new Date().toISOString().split('T')[0]}
                icon={<Calendar size={18} />}
              />
            </div>
            <Button fullWidth size="lg" className="mt-2" disabled={loading}>
              <Search size={18} /> {loading ? 'Recherche...' : 'Rechercher des trajets'}
            </Button>
          </form>

        </aside>

        <main className="search-results">
          {/* Carte */}
          <div className="map-container glass mb-6">
            <Map
              height="350px"
              markers={mapMarkers}
              center={searchOrigin || [36.8065, 10.1815]}
              zoom={searchOrigin ? 11 : 13}
              onMapClick={handleMapClick}
              routeColor="#f43f5e" 
            />
          </div>

          {/* Résultats */}
          <div className="results-list">
            {error && <div className="auth-error">{error}</div>}

            {!hasSearched ? (
              <div className="empty-results glass">
                <Search size={48} className="text-muted mb-4" />
                <h3>Entrez vos critères</h3>
                <p className="text-muted">Remplissez le formulaire pour voir les trajets disponibles.</p>
              </div>
            ) : trips.length === 0 ? (
              <div className="empty-results glass">
                <Search size={48} className="text-muted mb-4" />
                <h3>Aucun trajet trouvé</h3>
                <p className="text-muted">Essayez d'autres critères de recherche.</p>
              </div>
            ) : (
              <>
                <h3 className="mb-4">{trips.length} trajet{trips.length > 1 ? 's' : ''} trouvé{trips.length > 1 ? 's' : ''}</h3>
                <div className="trips-grid">
                  {trips.map(trip => (
                    <TripCard
                      key={trip.id}
                      trip={{
                        id: trip.id,
                        driver: { 
                          name: trip.driver_name, 
                          rating: trip.driver_rating, 
                          avatar: trip.driver_avatar,
                          email: trip.driver_email,
                          phone: trip.driver_phone
                        },
                        vehicle: { plateNumber: trip.vehicle_plate },
                        origin: trip.origin_name,
                        destination: trip.destination_name,
                        departureTime: new Date(trip.departure_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                        date: new Date(trip.departure_time).toLocaleDateString('fr-FR'),
                        price: trip.price,
                        seatsAvailable: trip.available_seats,
                      }}
                      onBook={() => handleBook(trip.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SearchTrips;
