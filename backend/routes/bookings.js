const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth.middleware');

// Créer une réservation (Protected, Passenger only)
router.post('/', auth, async (req, res) => {
  const { tripId, seats } = req.body;
  if (!tripId || !seats) return res.status(400).json({ message: 'tripId et seats sont requis' });

  try {
    // Vérifier s'il y a assez de places disponibles
    const [trips] = await db.execute('SELECT available_seats, status FROM trips WHERE id = ?', [tripId]);
    if (!trips.length) return res.status(404).json({ message: 'Trajet introuvable' });
    
    const trip = trips[0];
    if (trip.status !== 'active') return res.status(400).json({ message: 'Ce trajet n\'est plus actif' });
    if (trip.available_seats < seats) return res.status(400).json({ message: 'Pas assez de places disponibles' });

    // Créer la réservation
    const [result] = await db.execute(
      'INSERT INTO bookings (trip_id, passenger_id, seats_booked, status) VALUES (?, ?, ?, "pending")',
      [tripId, req.user.id, seats]
    );

    // Mettre à jour les places disponibles
    await db.execute('UPDATE trips SET available_seats = available_seats - ? WHERE id = ?', [seats, tripId]);

    // Optionnel : Créer une notification pour le conducteur
    // const [driverInfo] = await db.execute('SELECT driver_id FROM trips WHERE id = ?', [tripId]);
    // if(driverInfo.length) {
    //     await db.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)', 
    //         [driverInfo[0].driver_id, `Nouvelle réservation de ${seats} place(s) pour votre trajet.`]);
    // }

    res.status(201).json({ message: 'Réservation créée avec succès', bookingId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mes réservations (Protected)
router.get('/my', auth, async (req, res) => {
  try {
    let query = '';
    if (req.user.role === 'passenger') {
      // Réservations faites par le passager
      query = `
        SELECT b.*, t.origin_name, t.destination_name, t.departure_time, t.price, t.driver_id,
               u.full_name as driver_name,
               (SELECT COUNT(*) FROM reviews r WHERE r.trip_id = b.trip_id AND r.reviewer_id = b.passenger_id) as has_reviewed
        FROM bookings b 
        JOIN trips t ON b.trip_id = t.id 
        JOIN users u ON t.driver_id = u.id 
        WHERE b.passenger_id = ?
        ORDER BY t.departure_time DESC
      `;
    } else {
      // Réservations sur les trajets du conducteur
      query = `
        SELECT b.*, t.origin_name, t.destination_name, t.departure_time,
               u.full_name as passenger_name, u.phone as passenger_phone
        FROM bookings b
        JOIN trips t ON b.trip_id = t.id
        JOIN users u ON b.passenger_id = u.id
        WHERE t.driver_id = ?
        ORDER BY t.departure_time DESC
      `;
    }
    const [bookings] = await db.execute(query, [req.user.id]);
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour le statut d'une réservation (Protected, Driver only pour accepter/refuser)
router.put('/:id', auth, async (req, res) => {
  const { status } = req.body; // 'confirmed', 'cancelled', 'rejected'
  if (!['confirmed', 'cancelled', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Statut invalide' });
  }

  try {
    // Récupérer la réservation pour vérifier les droits
    const [bookings] = await db.execute(`
      SELECT b.*, t.driver_id 
      FROM bookings b 
      JOIN trips t ON b.trip_id = t.id 
      WHERE b.id = ?
    `, [req.params.id]);

    if (!bookings.length) return res.status(404).json({ message: 'Réservation introuvable' });
    const booking = bookings[0];

    // Vérification des droits : 
    // - Le passager peut annuler (cancelled)
    // - Le conducteur peut confirmer (confirmed) ou refuser (rejected)
    if (status === 'cancelled' && booking.passenger_id !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    if ((status === 'confirmed' || status === 'rejected') && booking.driver_id !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    console.log(`Mise à jour réservation ${req.params.id} vers statut: ${status}`);

    // Si on annule (passager) ou refuse (conducteur), on libère les places
    // MAIS seulement si la réservation était encore active (pending ou confirmed)
    if ((status === 'cancelled' || status === 'rejected') && (booking.status === 'pending' || booking.status === 'confirmed')) {
      console.log(`Libération de ${booking.seats_booked} places pour le trajet ${booking.trip_id}`);
      await db.execute('UPDATE trips SET available_seats = available_seats + ? WHERE id = ?', [booking.seats_booked, booking.trip_id]);
    }

    if (status === 'cancelled') {
      await db.execute('DELETE FROM bookings WHERE id = ?', [req.params.id]);
      return res.json({ message: 'Réservation annulée et supprimée' });
    }

    // Mise à jour de la réservation pour les autres statuts (confirmed, rejected)
    await db.execute('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);

    res.json({ message: `Réservation mise à jour : ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
