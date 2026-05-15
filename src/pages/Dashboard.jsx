import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Clock, Star, Car, Calendar, Users, ChevronRight, Trash2, AlertTriangle } from 'lucide-react';
import { TripCard } from '../components/TripCard';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { bookingAPI, tripAPI, reviewAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isDriver, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(isDriver ? 'trips' : 'reservations');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Review modal state
  const [reviewModal, setReviewModal] = useState({ isOpen: false, trip: null, rating: 5, comment: '', msg: '' });

  // Delete trip modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, trip: null, loading: false, error: '' });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'reservations' || activeTab === 'history') {
        const { data } = await bookingAPI.getMyBookings();
        
        const aggregatedData = data;

        const now = new Date();
        if (activeTab === 'history') {
          setItems(aggregatedData.filter(b => new Date(b.departure_time) < now));
        } else if (isDriver) {
          setItems(aggregatedData.filter(b => new Date(b.departure_time) >= now));
        } else {
          setItems(aggregatedData);
        }
      } else if (activeTab === 'trips' && isDriver) {
        const { data } = await tripAPI.getMyTrips();
        setItems(data);
      } else if (activeTab === 'reviews') {
        if (isDriver) {
          const { data } = await reviewAPI.getByDriver(user.id);
          setItems(data);
        } else {
          setItems([]);
        }
      }
    } catch (err) {
      setError('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
    fetchData();
  }, [activeTab, isDriver, user.id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await reviewAPI.create({
        driverId: reviewModal.trip.driver_id,
        tripId: reviewModal.trip.trip_id,
        rating: reviewModal.rating,
        comment: reviewModal.comment
      });
      setReviewModal({ ...reviewModal, msg: 'Avis ajouté avec succès !', isOpen: false });
      fetchData(); // Rafraîchir la liste pour masquer le bouton
      setTimeout(() => setReviewModal({ isOpen: false, trip: null, rating: 5, comment: '', msg: '' }), 3000);
    } catch (err) {
      setReviewModal({ ...reviewModal, msg: err.response?.data?.message || 'Erreur lors de l\'envoi' });
    }
  };

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await bookingAPI.updateStatus(bookingId, status);
      fetchData(); // Rafraîchir tout pour être sûr des nombres de places
    } catch (err) {
      alert("Erreur lors de la mise à jour : " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteTrip = async () => {
    if (!deleteModal.trip) return;
    setDeleteModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      await tripAPI.delete(deleteModal.trip.id);
      setDeleteModal({ isOpen: false, trip: null, loading: false, error: '' });
      navigate('/dashboard');
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la suppression du trajet.';
      setDeleteModal(prev => ({ ...prev, loading: false, error: msg }));
    }
  };

  const initials = user?.full_name 
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="dashboard-page container">
      <div className="dashboard-header">
        <h1>Mon Tableau de Bord</h1>
        <p className="text-muted">Gérez vos trajets et réservations.</p>
      </div>

      <div className="dashboard-content">
        <aside className="dashboard-sidebar glass">
          <div className="profile-summary">
            <div className="profile-avatar-large">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>
            <h3>{user?.full_name || 'Utilisateur'}</h3>
            <div className="flex items-center justify-center gap-1 text-sm text-muted">
              <Star size={14} className="text-accent" fill="currentColor" /> {user?.rating || 'N/A'}
            </div>
          </div>
          <nav className="dashboard-nav">
            {isDriver ? (
              <>
                <a 
                  href="#" 
                  className={activeTab === 'trips' ? 'active' : ''} 
                  onClick={(e) => { e.preventDefault(); setActiveTab('trips'); }}
                >
                  Mes trajets publiés
                </a>
                <a 
                  href="#" 
                  className={activeTab === 'reservations' ? 'active' : ''} 
                  onClick={(e) => { e.preventDefault(); setActiveTab('reservations'); }}
                >
                  Réservations sur mes trajets
                </a>
                <a 
                  href="#" 
                  className={activeTab === 'reviews' ? 'active' : ''} 
                  onClick={(e) => { e.preventDefault(); setActiveTab('reviews'); }}
                >
                  Avis reçus
                </a>
              </>
            ) : (
              <a 
                href="#" 
                className={activeTab === 'reservations' ? 'active' : ''} 
                onClick={(e) => { e.preventDefault(); setActiveTab('reservations'); }}
              >
                Mes réservations
              </a>
            )}
          </nav>
        </aside>

        <main className="dashboard-main">
          {error && <div className="auth-error mb-4">{error}</div>}
          
          <section className="dashboard-section">
            <h2>
              {activeTab === 'trips' && "Mes trajets publiés"}
              {activeTab === 'reservations' && (isDriver ? "Les réservations sur mes trajets" : "Mes réservations (passager)")}
              {activeTab === 'history' && "Mon historique de trajets"}
              {activeTab === 'reviews' && "Mes avis reçus"}
              {activeTab === 'settings' && "Mes paramètres"}
            </h2>
            
            {loading ? (
              <p>Chargement...</p>
            ) : activeTab === 'settings' ? (
              <div className="glass p-6 text-center text-muted">
                Paramètres du compte (à venir)
              </div>
            ) : activeTab === 'reviews' && !isDriver ? (
              <div className="glass p-6 text-center text-muted">
                Seuls les conducteurs peuvent recevoir des avis pour le moment.
              </div>
            ) : items.length === 0 ? (
              <div className="empty-state glass">
                {activeTab === 'trips' ? <Car size={48} className="text-muted mb-4" /> : 
                 activeTab === 'reviews' ? <Star size={48} className="text-muted mb-4" /> :
                 <Clock size={48} className="text-muted mb-4" />}
                <h3>
                  {activeTab === 'trips' ? 'Aucun trajet publié' : 
                   activeTab === 'reviews' ? 'Aucun avis reçu' : 
                   'Aucun trajet'}
                </h3>
                <p className="text-muted">
                  {activeTab === 'trips' ? "Vous n'avez pas encore publié de trajet." : 
                   activeTab === 'reviews' ? "Vous n'avez pas encore reçu d'avis." :
                   "Vous n'avez pas de trajet prévu pour le moment."}
                </p>
              </div>
            ) : (
              <div className="trips-list">
                {items.map(item => {
                  if (activeTab === 'reviews') {
                    return (
                      <div key={item.id} className="glass p-4 mb-4" style={{ borderRadius: '12px' }}>
                        <div className="flex justify-between mb-2 border-b border-white/10 pb-2">
                          <div>
                            <strong className="text-lg">{item.reviewer_name}</strong>
                            {item.origin_name && item.destination_name && (
                              <p className="text-xs text-muted mt-1">Trajet : {item.origin_name} → {item.destination_name}</p>
                            )}
                          </div>
                          <div className="flex items-center text-accent h-fit"><Star size={14} fill="currentColor" className="mr-1" /> {item.rating}/5</div>
                        </div>
                        <p className="text-sm">{item.comment || <span className="italic text-muted">Aucun commentaire</span>}</p>
                      </div>
                    );
                  }

                  if (isDriver && activeTab === 'reservations') {
                    return (
                      <div key={item.id} className="booking-card mb-8">
                        <div className="card-header flex justify-between items-center">
                          <div className="trip-route">
                            <span className="route-dot"></span>
                            <span>{item.origin_name}</span>
                            <span className="route-line"></span>
                            <span className="route-dot"></span>
                            <span>{item.destination_name}</span>
                          </div>
                          <div className={`badge-pro ${item.status}`}>
                            {item.status === 'pending' ? 'EN ATTENTE' : item.status === 'confirmed' ? 'CONFIRMÉE' : item.status === 'rejected' ? 'REFUSÉE' : 'ANNULÉE'}
                          </div>
                        </div>

                        <div className="card-body">
                          <div className="details-grid">
                            <div className="detail-item">
                              <span className="detail-label">Passager</span>
                              <span className="detail-value">{item.passenger_name}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Contact</span>
                              <span className="detail-value">📞 {item.passenger_phone || 'Non renseigné'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Places demandées</span>
                              <span className="detail-value text-accent">{item.seats_booked} place(s)</span>
                            </div>
                          </div>

                          {item.status === 'pending' && (
                            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
                              <Button 
                                onClick={() => handleUpdateStatus(item.id, 'confirmed')}
                                variant="primary"
                                className="flex-1"
                              >
                                Accepter
                              </Button>
                              <Button 
                                onClick={() => handleUpdateStatus(item.id, 'rejected')}
                                variant="outline"
                                className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                              >
                                Refuser
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  
                  if (!isDriver && (activeTab === 'reservations' || activeTab === 'history')) {
                    return (
                      <div key={item.id} className="booking-card mb-8">
                        {/* Header: Route & Status */}
                        <div className="card-header flex justify-between items-center">
                          <div className="trip-route">
                            <span className="route-dot"></span>
                            <span>{item.origin_name}</span>
                            <span className="route-line"></span>
                            <span className="route-dot"></span>
                            <span>{item.destination_name}</span>
                          </div>
                          <div className={`badge-pro ${item.status}`}>
                            {item.status === 'pending' ? 'EN ATTENTE' : item.status === 'confirmed' ? 'CONFIRMÉE' : item.status === 'rejected' ? 'REFUSÉE' : 'ANNULÉE'}
                          </div>
                        </div>

                        {/* Body: Details Grid */}
                        <div className="card-body">
                          <div className="details-grid">
                            <div className="detail-item">
                              <span className="detail-label">Départ</span>
                              <span className="detail-value">{new Date(item.departure_time).toLocaleDateString('fr-FR')} à {new Date(item.departure_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Conducteur</span>
                              <span className="detail-value">{item.driver_name}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Réservation</span>
                              <span className="detail-value">{item.seats_booked} place(s) • {item.price || '0'} TND</span>
                            </div>
                          </div>
                        </div>

                        {/* Footer: Actions & Evaluation */}
                        <div className="card-footer">
                          <div className="evaluation-section">
                            {item.status === 'confirmed' && item.has_reviewed > 0 && (
                              <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                                <Star size={16} fill="currentColor" /> Trajet évalué
                              </div>
                            )}
                            {item.status === 'confirmed' && !item.has_reviewed && new Date(item.departure_time) < new Date() && (
                              <Button 
                                onClick={() => setReviewModal({ ...reviewModal, isOpen: true, trip: item, msg: '' })} 
                                variant="primary"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <Star size={14} /> Laisser un avis
                              </Button>
                            )}
                          </div>

                          <div className="action-section">
                            {(item.status === 'pending' || item.status === 'confirmed') && new Date(item.departure_time) > new Date() && (
                              <button 
                                onClick={() => {
                                  if (window.confirm('Voulez-vous vraiment annuler cette réservation ?')) {
                                    handleUpdateStatus(item.id, 'cancelled');
                                  }
                                }}
                                className="text-sm text-red-600 font-semibold hover:text-red-800 transition-colors"
                              >
                                Annuler la réservation
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // For driver trips (activeTab === 'trips')
                  return (
                    <div key={item.id} className="relative mb-4">
                      <TripCard 
                        trip={{
                          id: item.id,
                          driver: { 
                            name: user.full_name,
                            rating: user.rating || 'N/A',
                            avatar: user.avatar_url,
                            email: user.email,
                            phone: user.phone
                          },
                          vehicle: { plateNumber: user.vehicle?.plate_number },
                          origin: item.origin_name,
                          destination: item.destination_name,
                          departureTime: new Date(item.departure_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                          date: new Date(item.departure_time).toLocaleDateString('fr-FR'),
                          price: item.price || 'Payé',
                          seatsAvailable: item.available_seats,
                        }} 
                      />
                      {/* Delete button — visible only to the trip owner */}
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, trip: item, loading: false, error: '' })}
                        className="trip-delete-btn"
                        title="Supprimer ce trajet"
                        aria-label="Supprimer le trajet"
                      >
                        <Trash2 size={15} />
                        Supprimer
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      {reviewModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass p-6 max-w-md w-full" style={{ borderRadius: '24px' }}>
            <h3 className="text-xl font-bold mb-4">Évaluer {reviewModal.trip?.driver_name}</h3>
            {reviewModal.msg && <div className="auth-error mb-4">{reviewModal.msg}</div>}
            <form onSubmit={handleSubmitReview} className="flex-col gap-4 flex">
              <div>
                <label className="input-label">Note (sur 5)</label>
                <input 
                  type="number" min="1" max="5" required
                  className="input-field mt-1" 
                  value={reviewModal.rating}
                  onChange={e => setReviewModal({...reviewModal, rating: e.target.value})}
                />
              </div>
              <div>
                <label className="input-label">Commentaire</label>
                <textarea 
                  className="input-field mt-1" rows="3"
                  value={reviewModal.comment}
                  onChange={e => setReviewModal({...reviewModal, comment: e.target.value})}
                  placeholder="Comment s'est passé le trajet ?"
                ></textarea>
              </div>
              <div className="flex gap-4 mt-4">
                <button type="button" className="btn btn-outline w-full" onClick={() => setReviewModal({...reviewModal, isOpen: false})}>Annuler</button>
                <button type="submit" className="btn btn-primary w-full">Envoyer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE TRIP CONFIRMATION MODAL ===== */}
      {deleteModal.isOpen && (
        <div className="delete-modal-overlay" onClick={() => !deleteModal.loading && setDeleteModal({ isOpen: false, trip: null, loading: false, error: '' })}>
          <div className="delete-modal-box" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <AlertTriangle size={32} />
            </div>
            <h3 className="delete-modal-title">Supprimer ce trajet ?</h3>
            <p className="delete-modal-route">
              {deleteModal.trip?.origin_name} → {deleteModal.trip?.destination_name}
            </p>
            <p className="delete-modal-warning">
              Cette action est irréversible. Les réservations en attente seront automatiquement annulées.
            </p>
            {deleteModal.error && (
              <div className="delete-modal-error">
                <AlertTriangle size={14} />
                {deleteModal.error}
              </div>
            )}
            <div className="delete-modal-actions">
              <button
                className="delete-modal-btn-cancel"
                onClick={() => setDeleteModal({ isOpen: false, trip: null, loading: false, error: '' })}
                disabled={deleteModal.loading}
              >
                Annuler
              </button>
              <button
                className="delete-modal-btn-confirm"
                onClick={handleDeleteTrip}
                disabled={deleteModal.loading}
              >
                {deleteModal.loading ? (
                  <span className="delete-modal-spinner" />
                ) : (
                  <Trash2 size={15} />
                )}
                {deleteModal.loading ? 'Suppression...' : 'Oui, supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewModal.msg && !reviewModal.isOpen && (
        <div className="fixed bottom-4 right-4 auth-success z-50">
          {reviewModal.msg}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
