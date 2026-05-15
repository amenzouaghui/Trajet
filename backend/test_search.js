const db = require('./config/db');

async function test() {
  console.log('--- TEST DE RECHERCHE ---');
  try {
    // 1. Test de base : voir tous les trajets actifs
    const [all] = await db.execute('SELECT id, origin_name, destination_name, status, available_seats FROM trips');
    console.log(`Nombre total de trajets en base : ${all.length}`);
    console.table(all);

    // 2. Simuler la recherche du site
    const origin = 'Tunis';
    const destination = 'hammet';
    
    let query = 'SELECT t.id, t.origin_name, t.destination_name FROM trips t JOIN users u ON t.driver_id = u.id WHERE t.status = "active" AND t.available_seats > 0';
    const params = [];

    // On teste juste avec l'origine pour voir
    query += ' AND (t.origin_name LIKE ? OR t.description LIKE ?)';
    params.push(`%${origin}%`, `%${origin}%`);

    console.log('\nExécution de la recherche pour "Tunis"...');
    const [results] = await db.execute(query, params);
    console.log(`Résultats trouvés : ${results.length}`);
    
    if (results.length === 0) {
      console.log('❌ Aucun trajet trouvé pour "Tunis".');
    } else {
      console.log('✅ Trajets trouvés !');
      console.table(results);
    }

  } catch (err) {
    console.error('❌ ERREUR LORS DU TEST :', err);
  } finally {
    process.exit(0);
  }
}

test();
