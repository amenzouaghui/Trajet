// backend/routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth.middleware');

// Get profile (auth required)
router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, full_name, email, phone, role, rating, avatar_url FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({message: 'Utilisateur introuvable'});
    const user = rows[0];
    // Si conducteur, récupérer le véhicule
    if (user.role === 'driver') {
        const [veh] = await db.execute('SELECT make, model, color, plate_number FROM vehicles WHERE user_id = ?', [user.id]);
        user.vehicle = veh[0] || null;
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Erreur serveur'});
  }
});

// Update profile (auth required) – partial update
router.put('/me', auth, async (req, res) => {
  const {fullName, phone, password} = req.body;
  const updates = [];
  const params = [];
  if (fullName) {updates.push('full_name = ?'); params.push(fullName);} 
  if (phone) {updates.push('phone = ?'); params.push(phone);} 
  if (password) {
    const {hashPassword} = require('../utils/hash');
    const hashed = await hashPassword(password);
    updates.push('password = ?'); params.push(hashed);
  }
  if (!updates.length) return res.status(400).json({message: 'Aucun champ à mettre à jour'});
  params.push(req.user.id);
  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  try {
    await db.execute(sql, params);
    res.json({message: 'Profil mis à jour'});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Erreur serveur'});
  }
});

// Update vehicle for driver (auth required)
router.put('/vehicle', auth, async (req, res) => {
  const {make, model, color, plateNumber} = req.body;
  if (req.user.role !== 'driver') {
    return res.status(403).json({message: 'Seuls les conducteurs peuvent gérer un véhicule'});
  }
  const updates = [];
  const params = [];
  if (make) {updates.push('make = ?'); params.push(make);} 
  if (model) {updates.push('model = ?'); params.push(model);} 
  if (color) {updates.push('color = ?'); params.push(color);} 
  if (plateNumber) {updates.push('plate_number = ?'); params.push(plateNumber);} 
  if (!updates.length) return res.status(400).json({message: 'Aucun champ à mettre à jour'});
  params.push(req.user.id);
  const sql = `UPDATE vehicles SET ${updates.join(', ')} WHERE user_id = ?`;
  try {
    await db.execute(sql, params);
    res.json({message: 'Véhicule mis à jour'});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Erreur serveur'});
  }
});

module.exports = router;
