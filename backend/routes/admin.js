const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

// Toutes les routes admin nécessitent auth + admin
router.use(auth, admin);

// ==================== STATISTIQUES ====================
router.get('/stats', async (req, res) => {
  try {
    const [usersCount] = await db.execute('SELECT COUNT(*) as total FROM users WHERE role != "admin"');
    const [driversCount] = await db.execute('SELECT COUNT(*) as total FROM users WHERE role = "driver"');
    const [passengersCount] = await db.execute('SELECT COUNT(*) as total FROM users WHERE role = "passenger"');
    const [tripsCount] = await db.execute('SELECT COUNT(*) as total FROM trips');
    const [activeTrips] = await db.execute('SELECT COUNT(*) as total FROM trips WHERE status = "active"');
    const [bookingsCount] = await db.execute('SELECT COUNT(*) as total FROM bookings');
    const [confirmedBookings] = await db.execute('SELECT COUNT(*) as total FROM bookings WHERE status = "confirmed"');
    const [pendingBookings] = await db.execute('SELECT COUNT(*) as total FROM bookings WHERE status = "pending"');
    const [reviewsCount] = await db.execute('SELECT COUNT(*) as total FROM reviews');
    const [avgRating] = await db.execute('SELECT AVG(rating) as avg FROM reviews');
    const [totalRevenue] = await db.execute(
      'SELECT COALESCE(SUM(t.price * b.seats_booked), 0) as total FROM bookings b JOIN trips t ON b.trip_id = t.id WHERE b.status = "confirmed"'
    );

    // Trajets récents (7 derniers jours)
    const [recentTrips] = await db.execute(
      'SELECT COUNT(*) as total FROM trips WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );
    const [recentBookings] = await db.execute(
      'SELECT COUNT(*) as total FROM bookings WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );

    res.json({
      users: {
        total: usersCount[0].total,
        drivers: driversCount[0].total,
        passengers: passengersCount[0].total,
      },
      trips: {
        total: tripsCount[0].total,
        active: activeTrips[0].total,
        recentWeek: recentTrips[0].total,
      },
      bookings: {
        total: bookingsCount[0].total,
        confirmed: confirmedBookings[0].total,
        pending: pendingBookings[0].total,
        recentWeek: recentBookings[0].total,
      },
      reviews: {
        total: reviewsCount[0].total,
        avgRating: avgRating[0].avg ? parseFloat(avgRating[0].avg).toFixed(2) : '0.00',
      },
      revenue: {
        total: parseFloat(totalRevenue[0].total).toFixed(2),
      },
    });
  } catch (err) {
    console.error('Erreur stats admin:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ==================== UTILISATEURS ====================

// Liste tous les utilisateurs (hors admins)
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, full_name, email, phone, role, rating, avatar_url, created_at FROM users WHERE role != "admin" ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Modifier le rôle d'un utilisateur
router.put('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['passenger', 'driver'].includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide. Valeurs acceptées : passenger, driver' });
  }
  try {
    const [result] = await db.execute('UPDATE users SET role = ? WHERE id = ? AND role != "admin"', [role, req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }
    res.json({ message: `Rôle mis à jour vers "${role}"` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un utilisateur
router.delete('/users/:id', async (req, res) => {
  try {
    // Empêcher la suppression d'un admin
    const [user] = await db.execute('SELECT role FROM users WHERE id = ?', [req.params.id]);
    if (!user.length) return res.status(404).json({ message: 'Utilisateur introuvable' });
    if (user[0].role === 'admin') return res.status(403).json({ message: 'Impossible de supprimer un administrateur' });

    await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ==================== TRAJETS ====================

// Liste tous les trajets
router.get('/trips', async (req, res) => {
  try {
    const [trips] = await db.execute(`
      SELECT t.*, u.full_name as driver_name, u.email as driver_email
      FROM trips t 
      JOIN users u ON t.driver_id = u.id 
      ORDER BY t.created_at DESC
    `);
    res.json(trips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Modifier le statut d'un trajet
router.put('/trips/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['active', 'cancelled', 'completed'].includes(status)) {
    return res.status(400).json({ message: 'Statut invalide' });
  }
  try {
    const [result] = await db.execute('UPDATE trips SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Trajet introuvable' });
    }
    res.json({ message: `Statut du trajet mis à jour vers "${status}"` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un trajet (force — admin)
router.delete('/trips/:id', async (req, res) => {
  try {
    // Annuler toutes les réservations liées
    await db.execute('UPDATE bookings SET status = "cancelled" WHERE trip_id = ? AND status IN ("pending", "confirmed")', [req.params.id]);
    
    const [result] = await db.execute('DELETE FROM trips WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Trajet introuvable' });
    }
    res.json({ message: 'Trajet supprimé avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ==================== RÉSERVATIONS ====================

// Liste toutes les réservations
router.get('/bookings', async (req, res) => {
  try {
    const [bookings] = await db.execute(`
      SELECT b.*, 
             t.origin_name, t.destination_name, t.departure_time, t.price,
             u.full_name as passenger_name,
             d.full_name as driver_name
      FROM bookings b 
      JOIN trips t ON b.trip_id = t.id 
      JOIN users u ON b.passenger_id = u.id
      JOIN users d ON t.driver_id = d.id
      ORDER BY b.created_at DESC
    `);
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
