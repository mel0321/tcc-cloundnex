-- backend/database/schema.sql

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('TRAVELER', 'BUSINESS')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS traveler_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    profile_picture TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_owner_id INTEGER NOT NULL,
    establishment_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('ACCOMMODATION', 'GASTRONOMY', 'TOURIST_ATTRACTION', 'OTHERS')),
    full_address TEXT NOT NULL,
    cep TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    description TEXT,
    price_per_night NUMERIC NOT NULL, -- Valor salvo em centavos
    accessibility_score REAL DEFAULT 0.0,
    main_image TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS place_accessibilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    place_id INTEGER NOT NULL UNIQUE,
    has_access_ramp INTEGER NOT NULL DEFAULT 0,
    has_adapted_bathroom INTEGER NOT NULL DEFAULT 0,
    allows_guide_dog INTEGER NOT NULL DEFAULT 0,
    has_braille_signage INTEGER NOT NULL DEFAULT 0,
    has_sign_language_interpreter INTEGER NOT NULL DEFAULT 0,
    has_asd_friendly_space INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    place_id INTEGER NOT NULL,
    traveler_id INTEGER NOT NULL,
    experience_rating INTEGER NOT NULL,
    accessibility_level TEXT NOT NULL CHECK (accessibility_level IN ('POOR', 'GOOD', 'EXCELLENT')),
    comment_text TEXT,
    owner_reply_text TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (place_id) REFERENCES places(id),
    FOREIGN KEY (traveler_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS favorites (
    traveler_id INTEGER NOT NULL,
    place_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (traveler_id, place_id),
    FOREIGN KEY (traveler_id) REFERENCES users(id),
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);