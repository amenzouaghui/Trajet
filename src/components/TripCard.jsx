import React from 'react';
import { MapPin, Clock, Calendar, Users, Star } from 'lucide-react';
import { Button } from './Button';
import './TripCard.css';

export const TripCard = ({ trip, onBook }) => {
  return (
    <div className="trip-card">
      <div className="trip-card-header">
        <div className="trip-driver">
          <div className="driver-avatar">
            {trip.driver?.avatar ? (
              <img src={trip.driver.avatar} alt={trip.driver.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              trip.driver?.name?.charAt(0) || 'D'
            )}
          </div>
          <div className="driver-info">
            <span className="driver-name">{trip.driver?.name || 'Driver'}</span>
            <div className="driver-rating">
              <Star size={12} className="star-icon" fill="currentColor" />
              <span>{trip.driver?.rating || 'N/A'}</span>
            </div>
            <div className="driver-contact text-xs text-muted mt-1">
              <p>📧 {trip.driver?.email}</p>
              <p>📞 {trip.driver?.phone}</p>
              {trip.vehicle?.plateNumber && (
                <p className="mt-1 font-semibold text-primary">🚗 Matricule: {trip.vehicle.plateNumber}</p>
              )}
            </div>
          </div>
        </div>
        <div className="trip-price">
          {trip.price} DT
        </div>
      </div>

      <div className="trip-route">
        <div className="route-timeline">
          <div className="timeline-dot start"></div>
          <div className="timeline-line"></div>
          <div className="timeline-dot end"></div>
        </div>
        <div className="route-details">
          <div className="route-point">
            <span className="point-time">{trip.departureTime}</span>
            <span className="point-city">{trip.origin}</span>
          </div>
          <div className="route-point">
            <span className="point-time">{trip.arrivalTime || '-'}</span>
            <span className="point-city">{trip.destination}</span>
          </div>
        </div>
      </div>

      <div className="trip-card-footer">
        <div className="trip-meta">
          <div className="meta-item">
            <Calendar size={14} />
            <span>{trip.date}</span>
          </div>
          <div className="meta-item">
            <Users size={14} />
            <span className="font-bold text-primary">{trip.seatsAvailable} places libres</span>
          </div>
        </div>
        {onBook && (
          <Button variant="primary" size="sm" onClick={onBook}>Réserver</Button>
        )}
      </div>
    </div>
  );
};
