import pool from "./db.js";

export async function migrate() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS wines (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        producer VARCHAR(255) NOT NULL,
        vintage INT NOT NULL,
        region VARCHAR(255) NOT NULL DEFAULT '',
        country VARCHAR(255) NOT NULL DEFAULT '',
        type ENUM('rot','weiss','rosé','schaumwein','dessert') NOT NULL,
        grape VARCHAR(255) NOT NULL DEFAULT '',
        quantity INT NOT NULL DEFAULT 0,
        purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        purchase_date VARCHAR(10) DEFAULT '',
        purchase_location VARCHAR(255) DEFAULT '',
        drink_from INT DEFAULT NULL,
        drink_until INT DEFAULT NULL,
        rating INT DEFAULT NULL,
        personal_rating INT DEFAULT NULL,
        notes TEXT,
        image_url TEXT,
        is_gift TINYINT(1) DEFAULT 0,
        gift_from VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS shopping_items (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        producer VARCHAR(255) NOT NULL DEFAULT '',
        quantity INT NOT NULL DEFAULT 1,
        estimated_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        reason VARCHAR(255) DEFAULT '',
        checked TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY DEFAULT 1,
        cellar_name VARCHAR(255) DEFAULT 'Yves Weinkeller',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // --- Pantry tables ---
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS pantry_items (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL DEFAULT '',
        quantity INT NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL DEFAULT 'Stück',
        location VARCHAR(255) NOT NULL DEFAULT '',
        expiry_date VARCHAR(10) DEFAULT '',
        purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS pantry_shopping_items (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL DEFAULT '',
        quantity INT NOT NULL DEFAULT 1,
        unit VARCHAR(50) NOT NULL DEFAULT 'Stück',
        estimated_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        reason VARCHAR(255) DEFAULT '',
        checked TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Ensure settings row exists
    await conn.execute(`
      INSERT IGNORE INTO settings (id, cellar_name) VALUES (1, 'Yves Weinkeller')
    `);

    console.log("Database migration completed.");
  } finally {
    conn.release();
  }
}
