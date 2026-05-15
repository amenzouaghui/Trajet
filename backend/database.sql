-- ============================================================
--  ProjetTrajet -- Script de création de la base de données
--  Base : trajetlocal  |  Moteur : MySQL / MariaDB
-- ============================================================

CREATE DATABASE IF NOT EXISTS trajetlocal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE trajetlocal;

-- ------------------------------------------------------------
-- 1. TABLE : users
--    Stocke conducteurs et passagers (rôle via ENUM)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  full_name   VARCHAR(100)      NOT NULL,
  email       VARCHAR(150)      NOT NULL UNIQUE,
  password    VARCHAR(255)      NOT NULL,           -- bcrypt hash
  phone       VARCHAR(20)       NOT NULL,
  role        ENUM('passenger','driver','admin') NOT NULL DEFAULT 'passenger',
  rating      DECIMAL(3,2)      NULL DEFAULT NULL,  -- note moyenne (1.00 – 5.00)
  avatar_url  TEXT              NULL DEFAULT NULL,
  created_at  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_users_email (email),
  INDEX idx_users_role  (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. TABLE : vehicles
--    Un véhicule par conducteur (relation 1-1 avec users)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED NOT NULL,
  make         VARCHAR(50)  NOT NULL,           -- marque  (ex : Peugeot)
  model        VARCHAR(50)  NOT NULL,           -- modèle  (ex : 208)
  color        VARCHAR(30)  NOT NULL,
  plate_number VARCHAR(20)  NOT NULL UNIQUE,   -- immatriculation
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_vehicles_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_vehicles_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. TABLE : trips
--    Trajets publiés par les conducteurs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trips (
  id               INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  driver_id        INT UNSIGNED      NOT NULL,
  origin_name      VARCHAR(200)      NOT NULL,
  destination_name VARCHAR(200)      NOT NULL,
  origin_lat       DECIMAL(10,7)     NULL DEFAULT NULL,
  origin_lng       DECIMAL(10,7)     NULL DEFAULT NULL,
  destination_lat  DECIMAL(10,7)     NULL DEFAULT NULL,
  destination_lng  DECIMAL(10,7)     NULL DEFAULT NULL,
  departure_time   DATETIME          NOT NULL,
  price            DECIMAL(8,2)      NOT NULL,
  total_seats      TINYINT UNSIGNED  NOT NULL DEFAULT 4,
  available_seats  TINYINT UNSIGNED  NOT NULL DEFAULT 4,
  description      TEXT              NULL DEFAULT NULL,
  waypoints        TEXT              NULL DEFAULT NULL,  -- étapes intermédiaires (texte libre ou JSON)
  status           ENUM('active','cancelled','completed') NOT NULL DEFAULT 'active',
  created_at       DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_trips_driver
    FOREIGN KEY (driver_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_trips_driver         (driver_id),
  INDEX idx_trips_status         (status),
  INDEX idx_trips_departure      (departure_time),
  INDEX idx_trips_origin         (origin_name(50)),
  INDEX idx_trips_destination    (destination_name(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. TABLE : bookings
--    Réservations de places sur un trajet
--    Statuts : pending → confirmed | rejected | cancelled
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  trip_id      INT UNSIGNED NOT NULL,
  passenger_id INT UNSIGNED NOT NULL,
  seats_booked TINYINT UNSIGNED NOT NULL DEFAULT 1,
  status       ENUM('pending','confirmed','rejected','cancelled') NOT NULL DEFAULT 'pending',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_bookings_trip
    FOREIGN KEY (trip_id) REFERENCES trips (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_bookings_passenger
    FOREIGN KEY (passenger_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_bookings_trip      (trip_id),
  INDEX idx_bookings_passenger (passenger_id),
  INDEX idx_bookings_status    (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. TABLE : reviews
--    Avis laissés par des passagers sur des conducteurs
--    Un seul avis par (reviewer, trip) — garanti par UNIQUE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  reviewer_id INT UNSIGNED     NOT NULL,   -- passager qui évalue
  reviewee_id INT UNSIGNED     NOT NULL,   -- conducteur évalué
  trip_id     INT UNSIGNED     NOT NULL,
  rating      TINYINT UNSIGNED NOT NULL,   -- 1 à 5
  comment     TEXT             NULL DEFAULT NULL,
  created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_reviews_reviewer
    FOREIGN KEY (reviewer_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_reviewee
    FOREIGN KEY (reviewee_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_trip
    FOREIGN KEY (trip_id) REFERENCES trips (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_review_per_trip (reviewer_id, trip_id),
  CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
  INDEX idx_reviews_reviewee (reviewee_id),
  INDEX idx_reviews_trip     (trip_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. TABLE : notifications
--    Notifications en temps réel pour les utilisateurs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  message    TEXT         NOT NULL,
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_notifications_user    (user_id),
  INDEX idx_notifications_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Données de test (optionnel – à supprimer en production)
-- ============================================================

-- Conducteur de test  (mot de passe : Test1234!)
-- Le hash bcrypt ci-dessous correspond à "Test1234!"
INSERT INTO users (full_name, email, password, phone, role)
VALUES (
  'Ahmed Ben Ali',
  'ahmed@trajet.tn',
  '$2b$10$X9.iBt4F/YS5X6m0VsAFGe6e8LYH5sA2mCb4vKuW1NWpTl.sDAIeG',
  '+21698765432',
  'driver'
);

-- Véhicule du conducteur de test
INSERT INTO vehicles (user_id, make, model, color, plate_number)
VALUES (1, 'Peugeot', '208', 'Gris', '123 TUN 4567');

-- Passager de test  (mot de passe : Test1234!)
INSERT INTO users (full_name, email, password, phone, role)
VALUES (
  'Sarra Trabelsi',
  'sarra@trajet.tn',
  '$2b$10$X9.iBt4F/YS5X6m0VsAFGe6e8LYH5sA2mCb4vKuW1NWpTl.sDAIeG',
  '+21655443322',
  'passenger'
);

-- Trajet de test
INSERT INTO trips (driver_id, origin_name, destination_name, origin_lat, origin_lng,
                   destination_lat, destination_lng, departure_time, price, total_seats,
                   available_seats, description)
VALUES (1, 'Tunis', 'Sousse', 36.8190, 10.1658, 35.8256, 10.6369,
        DATE_ADD(NOW(), INTERVAL 2 DAY), 8.00, 4, 4,
        'Trajet direct sans arrêt. Climatisation disponible.');

-- Administrateur (mot de passe : Admin1234!)
INSERT INTO users (full_name, email, password, phone, role)
VALUES (
  'Administrateur',
  'admin@trajet.tn',
  '$2b$10$X9.iBt4F/YS5X6m0VsAFGe6e8LYH5sA2mCb4vKuW1NWpTl.sDAIeG',
  '+21600000000',
  'admin'
);
