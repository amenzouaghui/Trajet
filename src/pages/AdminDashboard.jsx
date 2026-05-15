import React, { useState, useEffect } from 'react';
import { Users, Car, Calendar, Star, TrendingUp, Trash2, Shield, RefreshCw } from 'lucide-react';
import { adminAPI } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [data, setData] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'stats') {
        const res = await adminAPI.getStats();
        setStats(res.data);
      } else if (activeTab === 'users') {
        const res = await adminAPI.getUsers();
        setData(res.data);
      } else if (activeTab === 'trips') {
        const res = await adminAPI.getTrips();
        setData(res.data);
      } else if (activeTab === 'bookings') {
        const res = await adminAPI.getBookings();
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      await adminAPI.deleteUser(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleToggleRole = async (id, currentRole) => {
    const newRole = currentRole === 'driver' ? 'passenger' : 'driver';
    if (!window.confirm(`Changer le rôle en "${newRole}" ?`)) return;
    try {
      await adminAPI.updateUserRole(id, newRole);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du changement de rôle');
    }
  };

  const handleDeleteTrip = async (id) => {
    if (!window.confirm('Supprimer ce trajet ?')) return;
    try {
      await adminAPI.deleteTrip(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const getRoleBadge = (role) => {
    const map = { driver: 'badge-driver', passenger: 'badge-passenger', admin: 'badge-admin' };
    return <span className={`badge ${map[role] || ''}`}>{role}</span>;
  };

  const getStatusBadge = (status) => {
    const map = {
      active: 'badge-active', cancelled: 'badge-cancelled', completed: 'badge-completed',
      pending: 'badge-pending', confirmed: 'badge-confirmed', rejected: 'badge-rejected'
    };
    return <span className={`badge ${map[status] || ''}`}>{status}</span>;
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR');
  const formatTime = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1>Administration</h1>
          <p>Gestion globale de la plateforme TrajetLocal</p>
        </div>
        <button className="admin-refresh-btn" onClick={fetchData}>
          <RefreshCw size={16} />
          Rafraîchir
        </button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {[
          { key: 'stats',    icon: <TrendingUp size={16} />, label: 'Statistiques' },
          { key: 'users',    icon: <Users size={16} />,      label: 'Utilisateurs' },
          { key: 'trips',    icon: <Car size={16} />,        label: 'Trajets' },
          { key: 'bookings', icon: <Calendar size={16} />,   label: 'Réservations' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`admin-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="admin-loading">
          <RefreshCw size={38} className="spin" />
          <p>Chargement...</p>
        </div>
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : (
        <>
          {/* ===== STATS ===== */}
          {activeTab === 'stats' && stats && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                    <Users size={24} />
                  </div>
                  <div>
                    <div className="stat-label">Utilisateurs</div>
                    <div className="stat-number">{stats.users?.total ?? 0}</div>
                    <div className="stat-sub">{stats.users?.drivers ?? 0} conducteurs · {stats.users?.passengers ?? 0} passagers</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>
                    <Car size={24} />
                  </div>
                  <div>
                    <div className="stat-label">Trajets</div>
                    <div className="stat-number">{stats.trips?.total ?? 0}</div>
                    <div className="stat-sub">{stats.trips?.active ?? 0} actifs · {stats.trips?.recentWeek ?? 0} cette semaine</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80' }}>
                    <Calendar size={24} />
                  </div>
                  <div>
                    <div className="stat-label">Réservations</div>
                    <div className="stat-number">{stats.bookings?.total ?? 0}</div>
                    <div className="stat-sub">{stats.bookings?.confirmed ?? 0} confirmées · {stats.bookings?.recentWeek ?? 0} cette semaine</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <div className="stat-label">Chiffre d'Affaires</div>
                    <div className="stat-number">{stats.revenue?.total ?? 0}</div>
                    <div className="stat-sub">TND — réservations confirmées</div>
                  </div>
                </div>
              </div>

              <div className="rating-panel">
                <div className="rating-panel-header">
                  <h3>Satisfaction Globale</h3>
                  <div className="rating-display">
                    <Star size={20} fill="currentColor" />
                    <span className="rating-value">{stats.reviews?.avgRating ?? '—'}</span>
                    <span className="rating-total">/ 5 ({stats.reviews?.total ?? 0} avis)</span>
                  </div>
                </div>
                <div className="rating-bar-bg">
                  <div
                    className="rating-bar-fill"
                    style={{ width: `${((stats.reviews?.avgRating ?? 0) / 5) * 100}%` }}
                  />
                </div>
              </div>
            </>
          )}

          {/* ===== USERS ===== */}
          {activeTab === 'users' && (
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Téléphone</th>
                    <th>Rôle</th>
                    <th>Note</th>
                    <th>Inscrit le</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Aucun utilisateur trouvé.</td></tr>
                  ) : data.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-av">
                            {user.avatar_url
                              ? <img src={user.avatar_url} alt={user.full_name} />
                              : user.full_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div className="user-name">{user.full_name}</div>
                            <div className="user-email">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{user.phone}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>
                        <div className="star-rating">
                          <Star size={13} fill="currentColor" /> {user.rating ?? 'N/A'}
                        </div>
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        <div className="action-btns">
                          {user.role !== 'admin' && (
                            <button className="act-btn info" title="Changer le rôle" onClick={() => handleToggleRole(user.id, user.role)}>
                              <Shield size={15} />
                            </button>
                          )}
                          <button className="act-btn danger" title="Supprimer" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ===== TRIPS ===== */}
          {activeTab === 'trips' && (
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Trajet</th>
                    <th>Conducteur</th>
                    <th>Départ</th>
                    <th>Prix</th>
                    <th>Places</th>
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Aucun trajet trouvé.</td></tr>
                  ) : data.map(trip => (
                    <tr key={trip.id}>
                      <td>
                        <div className="user-name">{trip.origin_name} → {trip.destination_name}</div>
                        <div className="user-email" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.description || '—'}</div>
                      </td>
                      <td>
                        <div className="user-name">{trip.driver_name}</div>
                        <div className="user-email">{trip.driver_email}</div>
                      </td>
                      <td>
                        <div>{formatDate(trip.departure_time)}</div>
                        <div className="user-email">{formatTime(trip.departure_time)}</div>
                      </td>
                      <td style={{ color: '#f43f5e', fontWeight: 700 }}>{trip.price} TND</td>
                      <td>{trip.available_seats}/{trip.total_seats}</td>
                      <td>{getStatusBadge(trip.status)}</td>
                      <td>
                        <div className="action-btns">
                          <button className="act-btn danger" title="Supprimer" onClick={() => handleDeleteTrip(trip.id)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ===== BOOKINGS ===== */}
          {activeTab === 'bookings' && (
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Trajet</th>
                    <th>Passager</th>
                    <th>Conducteur</th>
                    <th>Places</th>
                    <th>Total</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Aucune réservation trouvée.</td></tr>
                  ) : data.map(booking => (
                    <tr key={booking.id}>
                      <td>
                        <div className="user-name">{booking.origin_name} → {booking.destination_name}</div>
                        <div className="user-email">{formatDate(booking.departure_time)}</div>
                      </td>
                      <td>{booking.passenger_name}</td>
                      <td>{booking.driver_name}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{booking.seats_booked}</td>
                      <td style={{ color: '#f43f5e', fontWeight: 700 }}>{(booking.price * booking.seats_booked).toFixed(2)} TND</td>
                      <td>{getStatusBadge(booking.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
