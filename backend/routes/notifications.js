const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth.middleware');

// Obtenir toutes ses notifications (Protected)
router.get('/', auth, async (req, res) => {
  try {
    const [notifications] = await db.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Marquer une notification comme lue (Protected)
router.put('/:id/read', auth, async (req, res) => {
  try {
    const [result] = await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification introuvable ou accès refusé' });
    }

    res.json({ message: 'Notification marquée comme lue' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Marquer toutes les notifications comme lues (Protected)
router.put('/read-all', auth, async (req, res) => {
  try {
    await db.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE', [req.user.id]);
    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
