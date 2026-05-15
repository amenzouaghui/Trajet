const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth.middleware');

// Ajouter un avis (Protected)
router.post('/', auth, async (req, res) => {
  const { driverId, tripId, rating, comment } = req.body;

  if (!driverId || !tripId || !rating) {
    return res.status(400).json({ message: 'Données incomplètes' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'La note doit être entre 1 et 5' });
  }

  try {
    // Vérifier si l'utilisateur a bien voyagé avec ce conducteur (optionnel mais recommandé)
    const [bookings] = await db.execute(`
      SELECT b.id FROM bookings b 
      JOIN trips t ON b.trip_id = t.id
      WHERE b.passenger_id = ? AND t.id = ? AND t.driver_id = ? AND b.status = 'confirmed'
    `, [req.user.id, tripId, driverId]);

    if (!bookings.length) {
      return res.status(403).json({ message: 'Vous ne pouvez évaluer que les trajets confirmés auxquels vous avez participé.' });
    }

    // Vérifier si un avis a déjà été laissé pour ce trajet par cet utilisateur
    const [existingReviews] = await db.execute(
      'SELECT id FROM reviews WHERE reviewer_id = ? AND trip_id = ?',
      [req.user.id, tripId]
    );

    if (existingReviews.length > 0) {
      return res.status(400).json({ message: 'Vous avez déjà laissé un avis pour ce trajet.' });
    }

    // Créer l'avis
    await db.execute(
      'INSERT INTO reviews (reviewer_id, reviewee_id, trip_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, driverId, tripId, rating, comment || null]
    );

    // Mettre à jour la note moyenne du conducteur
    const [avgResult] = await db.execute(
      'SELECT AVG(rating) as avgRating FROM reviews WHERE reviewee_id = ?',
      [driverId]
    );
    const newRating = avgResult[0].avgRating;
    await db.execute('UPDATE users SET rating = ? WHERE id = ?', [newRating, driverId]);

    res.status(201).json({ message: 'Avis ajouté avec succès', newRating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir les avis d'un conducteur (Public)
router.get('/driver/:id', async (req, res) => {
  try {
    const [reviews] = await db.execute(`
      SELECT r.*, u.full_name as reviewer_name, t.origin_name, t.destination_name
      FROM reviews r 
      JOIN users u ON r.reviewer_id = u.id 
      LEFT JOIN trips t ON r.trip_id = t.id
      WHERE r.reviewee_id = ?
      ORDER BY r.created_at DESC
    `, [req.params.id]);

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
