const db = require('./config/db');

async function testCancel() {
  try {
    // 1. Créer un trajet test avec 4 places
    const [t] = await db.execute('INSERT INTO trips (driver_id, origin_name, destination_name, departure_time, available_seats, status, price) VALUES (1, "Test A", "Test B", NOW(), 4, "active", 10)');
    const tripId = t.insertId;
    console.log('Trajet créé. ID:', tripId, 'Places dispos: 4');

    // 2. Faire une réservation de 2 places
    const [b] = await db.execute('INSERT INTO bookings (trip_id, passenger_id, seats_booked, status) VALUES (?, 2, 2, "confirmed")', [tripId]);
    const bookingId = b.insertId;
    await db.execute('UPDATE trips SET available_seats = available_seats - 2 WHERE id = ?', [tripId]);
    
    let [trip] = await db.execute('SELECT available_seats FROM trips WHERE id = ?', [tripId]);
    console.log('Après réservation de 2 places. Places dispos:', trip[0].available_seats); // Devrait être 2

    // 3. Annuler la réservation (Simulation du code actuel)
    const [booking] = await db.execute('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (booking[0].status !== 'cancelled') {
        await db.execute('UPDATE trips SET available_seats = available_seats + ? WHERE id = ?', [booking[0].seats_booked, tripId]);
        await db.execute('UPDATE bookings SET status = "cancelled" WHERE id = ?', [bookingId]);
    }

    [trip] = await db.execute('SELECT available_seats FROM trips WHERE id = ?', [tripId]);
    console.log('Après annulation. Places dispos:', trip[0].available_seats); // Devrait être 4

    // Nettoyage
    await db.execute('DELETE FROM bookings WHERE id = ?', [bookingId]);
    await db.execute('DELETE FROM trips WHERE id = ?', [tripId]);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testCancel();
