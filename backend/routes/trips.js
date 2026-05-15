const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth.middleware');

// Publier un trajet (Protected, Driver only)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'driver') {
    return res.status(403).json({ message: 'Seuls les conducteurs peuvent publier un trajet' });
  }

  const { 
    originName, destinationName, originLat, originLng, 
    destinationLat, destinationLng, departureTime, price, totalSeats, description, waypoints 
  } = req.body;

  try {
    const [result] = await db.execute(
      `INSERT INTO trips (driver_id, origin_name, destination_name, origin_lat, origin_lng, 
      destination_lat, destination_lng, departure_time, price, total_seats, available_seats, description, waypoints) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, originName, destinationName, originLat, originLng, 
       destinationLat, destinationLng, departureTime, price, totalSeats, totalSeats, description, waypoints]
    );

    res.status(201).json({ message: 'Trajet publié avec succès', tripId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la publication du trajet' });
  }
});

// Obtenir les trajets publiés par le conducteur (Protected, Driver only)
router.get('/my-trips', auth, async (req, res) => {
  if (req.user.role !== 'driver') {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  try {
    const [trips] = await db.execute('SELECT * FROM trips WHERE driver_id = ? ORDER BY departure_time DESC', [req.user.id]);
    res.json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération de vos trajets' });
  }
});

// Rechercher des trajets (Public)
router.get('/search', async (req, res) => {
  const { origin, destination, date } = req.query;
  console.log('--- REQUÊTE DE RECHERCHE (Version avec Contact) ---');
  console.log('Search request:', { origin, destination, date });

  try {
    let query = `
      SELECT t.*, u.full_name as driver_name, u.rating as driver_rating, u.avatar_url as driver_avatar,
             u.email as driver_email, u.phone as driver_phone, v.plate_number as vehicle_plate
      FROM trips t 
      JOIN users u ON t.driver_id = u.id 
      LEFT JOIN vehicles v ON u.id = v.user_id
      WHERE t.status = "active" AND t.available_seats > 0
    `;
    const params = [];

    if (origin && origin.trim() !== '') {
      query += ' AND (t.origin_name LIKE ? OR COALESCE(t.description, "") LIKE ? OR COALESCE(t.waypoints, "") LIKE ?)';
      params.push(`%${origin.trim()}%`, `%${origin.trim()}%`, `%${origin.trim()}%`);
    }
    if (destination && destination.trim() !== '') {
      query += ' AND (t.destination_name LIKE ? OR COALESCE(t.description, "") LIKE ? OR COALESCE(t.waypoints, "") LIKE ?)';
      params.push(`%${destination.trim()}%`, `%${destination.trim()}%`, `%${destination.trim()}%`);
    }
    if (date && date.trim() !== '') {
      query += ' AND DATE(t.departure_time) = ?';
      params.push(date);
    }

    console.log('Executing query:', query, 'with params:', params);
    const [trips] = await db.execute(query, params);
    res.json(trips);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Erreur lors de la recherche de trajets' });
  }
});

// Obtenir les détails d'un trajet (Public)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT t.*, u.full_name as driver_name, u.phone as driver_phone, u.rating as driver_rating, 
             v.make as vehicle_make, v.model as vehicle_model, v.color as vehicle_color
      FROM trips t 
      JOIN users u ON t.driver_id = u.id 
      LEFT JOIN vehicles v ON u.id = v.user_id
      WHERE t.id = ?
    `, [req.params.id]);

    if (!rows.length) {
      return res.status(404).json({ message: 'Trajet introuvable' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour un trajet (Protected, Driver only)
router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'driver') {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  
  const { departureTime, price, description, status } = req.body;
  const updates = [];
  const params = [];

  if (departureTime) { updates.push('departure_time = ?'); params.push(departureTime); }
  if (price) { updates.push('price = ?'); params.push(price); }
  if (description) { updates.push('description = ?'); params.push(description); }
  if (status) { updates.push('status = ?'); params.push(status); }

  if (!updates.length) return res.status(400).json({ message: 'Aucun champ à modifier' });

  params.push(req.params.id, req.user.id); // req.user.id ensures the driver owns the trip

  try {
    const [result] = await db.execute(`UPDATE trips SET ${updates.join(', ')} WHERE id = ? AND driver_id = ?`, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Trajet introuvable ou non autorisé' });
    }
    res.json({ message: 'Trajet mis à jour' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un trajet (Protected, Driver only)
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'driver') {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  try {
    // 1. Vérifier que le trajet appartient bien au conducteur
    const [trips] = await db.execute('SELECT id FROM trips WHERE id = ? AND driver_id = ?', [req.params.id, req.user.id]);
    if (!trips.length) {
      return res.status(404).json({ message: 'Trajet introuvable ou non autorisé' });
    }

    // 2. Bloquer la suppression si des réservations confirmées existent
    const [confirmedBookings] = await db.execute(
      'SELECT id FROM bookings WHERE trip_id = ? AND status = "confirmed"',
      [req.params.id]
    );
    if (confirmedBookings.length > 0) {
      return res.status(400).json({
        message: `Impossible de supprimer ce trajet : ${confirmedBookings.length} réservation(s) confirmée(s) existent. Veuillez d'abord les annuler.`
      });
    }

    // 3. Annuler automatiquement toutes les réservations "pending"
    const [pendingBookings] = await db.execute(
      'SELECT id, seats_booked FROM bookings WHERE trip_id = ? AND status = "pending"',
      [req.params.id]
    );
    if (pendingBookings.length > 0) {
      await db.execute(
        'UPDATE bookings SET status = "cancelled" WHERE trip_id = ? AND status = "pending"',
        [req.params.id]
      );
      console.log(`${pendingBookings.length} réservation(s) pending annulée(s) automatiquement pour le trajet ${req.params.id}`);
    }

    // 4. Supprimer le trajet
    await db.execute('DELETE FROM trips WHERE id = ?', [req.params.id]);

    res.json({
      message: 'Trajet supprimé avec succès',
      cancelledBookings: pendingBookings.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
