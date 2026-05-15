const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signToken } = require('../utils/token');

// ==================== INSCRIPTION ====================
router.post('/register', async (req, res) => {
  const { fullName, email, password, phone, role, vehicleMake, vehicleModel, vehicleColor, plateNumber, avatar } = req.body;

  // Validation
  if (!fullName || !email || !password || !phone || !role) {
    return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
  }
  if (!['passenger', 'driver'].includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide' });
  }
  if (role === 'driver' && (!vehicleMake || !vehicleModel || !vehicleColor || !plateNumber)) {
    return res.status(400).json({ message: 'Les informations du véhicule sont requises pour un conducteur' });
  }

  try {
    // Vérifier si l'email existe déjà
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password);

    // Créer l'utilisateur
    const [result] = await db.execute(
      'INSERT INTO users (full_name, email, password, phone, role, avatar_url) VALUES (?, ?, ?, ?, ?, ?)',
      [fullName, email, hashedPassword, phone, role, avatar]
    );
    const userId = result.insertId;

    // Si conducteur, créer le véhicule
    if (role === 'driver') {
      await db.execute(
        'INSERT INTO vehicles (user_id, make, model, color, plate_number) VALUES (?, ?, ?, ?, ?)',
        [userId, vehicleMake, vehicleModel, vehicleColor, plateNumber]
      );
    }

    // Générer le token
    const token = signToken({ id: userId, role, email });

    res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: { id: userId, full_name: fullName, email, phone, role, avatar_url: avatar }
    });
  } catch (err) {
    console.error('Erreur inscription:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ==================== CONNEXION ====================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = rows[0];
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = signToken({ id: user.id, role: user.role, email: user.email });

    // Ne pas renvoyer le hash du mot de passe
    const { password: _, ...safeUser } = user;

    res.json({
      message: 'Connexion réussie',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Erreur connexion:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
// ==================== VÉRIFICATION EMAIL ====================
router.post('/check-email', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email requis' });
  }

  try {
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.json({ available: false });
    }
    return res.json({ available: true });
  } catch (err) {
    console.error('Erreur vérification email:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
