// Script pour générer un vrai hash bcrypt et insérer l'admin en base
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
require('dotenv').config();

const password = 'Admin123!';

async function createAdmin() {
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);

  console.log('\n✅ Hash généré avec succès !');
  console.log('─────────────────────────────────────────────────────');
  console.log('Exécutez ce SQL dans phpMyAdmin :');
  console.log(`
DELETE FROM users WHERE email = 'admin@trajet.tn';

INSERT INTO users (full_name, email, password, phone, role)
VALUES (
  'Admin TrajetLocal',
  'admin@trajet.tn',
  '${hash}',
  '20000000',
  'admin'
);
`);
  console.log('─────────────────────────────────────────────────────');
  console.log('📧 Email    : admin@trajet.tn');
  console.log('🔑 Password : Admin123!');
  console.log('─────────────────────────────────────────────────────\n');
  process.exit(0);
}

createAdmin();
