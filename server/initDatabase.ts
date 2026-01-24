import { pool } from "./db";

export async function initializeDatabase() {
  const client = await pool.connect();

  try {
    await client.query(`
      -- Capacity calendar for daily booking limits
      CREATE TABLE IF NOT EXISTS capacity_calendar (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        day_type TEXT NOT NULL DEFAULT 'normal',
        max_slots INTEGER NOT NULL DEFAULT 7,
        booked_slots INTEGER NOT NULL DEFAULT 0,
        notes TEXT
      );

      -- Dishes/Menu items for package selection
      CREATE TABLE IF NOT EXISTS dishes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        tags TEXT[],
        image_url TEXT,
        additional_cost INTEGER DEFAULT 0,
        is_available BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0
      );

      -- Add-ons/Extra services
      CREATE TABLE IF NOT EXISTS add_ons (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        price_type TEXT NOT NULL DEFAULT 'fixed',
        price INTEGER NOT NULL,
        min_quantity INTEGER DEFAULT 1,
        max_quantity INTEGER,
        is_available BOOLEAN DEFAULT true
      );

      -- Custom quote requests (depends on customers table)
      CREATE TABLE IF NOT EXISTS custom_quotes (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        quote_reference TEXT NOT NULL UNIQUE,
        event_date DATE NOT NULL,
        event_time TEXT NOT NULL,
        event_type TEXT NOT NULL,
        guest_count INTEGER NOT NULL,
        venue_address TEXT NOT NULL,
        budget INTEGER,
        preferences TEXT,
        special_requests TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        proposed_package TEXT,
        proposed_price INTEGER,
        deposit_amount INTEGER,
        admin_notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Package dishes junction table
      CREATE TABLE IF NOT EXISTS package_dishes (
        package_id INTEGER NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
        dish_id INTEGER NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
        is_required BOOLEAN DEFAULT false,
        max_selections INTEGER DEFAULT 1,
        PRIMARY KEY (package_id, dish_id)
      );

      -- Booking dishes (selected dishes for a booking)
      CREATE TABLE IF NOT EXISTS booking_dishes (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        dish_id INTEGER NOT NULL REFERENCES dishes(id),
        quantity INTEGER DEFAULT 1
      );

      -- Booking add-ons (selected add-ons for a booking)
      CREATE TABLE IF NOT EXISTS booking_add_ons (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        add_on_id INTEGER NOT NULL REFERENCES add_ons(id),
        quantity INTEGER DEFAULT 1,
        total_price INTEGER NOT NULL
      );

      -- Add new columns to bookings table if they don't exist
      DO $$ 
      BEGIN
        -- Service Packages new columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_packages' AND column_name = 'has_themed_cake') THEN
          ALTER TABLE service_packages ADD COLUMN has_themed_cake BOOLEAN DEFAULT false;
        END IF;

        -- Bookings new columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'theme') THEN
          ALTER TABLE bookings ADD COLUMN theme TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'package_id') THEN
          ALTER TABLE bookings ADD COLUMN package_id INTEGER REFERENCES service_packages(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'event_duration') THEN
          ALTER TABLE bookings ADD COLUMN event_duration INTEGER DEFAULT 4;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'deposit_amount') THEN
          ALTER TABLE bookings ADD COLUMN deposit_amount INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'deposit_paid') THEN
          ALTER TABLE bookings ADD COLUMN deposit_paid BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'deposit_payment_method') THEN
          ALTER TABLE bookings ADD COLUMN deposit_payment_method TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'deposit_payment_reference') THEN
          ALTER TABLE bookings ADD COLUMN deposit_payment_reference TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'deposit_paid_at') THEN
          ALTER TABLE bookings ADD COLUMN deposit_paid_at TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'balance_amount') THEN
          ALTER TABLE bookings ADD COLUMN balance_amount INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'balance_paid') THEN
          ALTER TABLE bookings ADD COLUMN balance_paid BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'balance_payment_method') THEN
          ALTER TABLE bookings ADD COLUMN balance_payment_method TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'balance_payment_reference') THEN
          ALTER TABLE bookings ADD COLUMN balance_payment_reference TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'balance_paid_at') THEN
          ALTER TABLE bookings ADD COLUMN balance_paid_at TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'admin_notes') THEN
          ALTER TABLE bookings ADD COLUMN admin_notes TEXT;
        END IF;
      END $$;
    `);

    console.log("Database tables initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  } finally {
    client.release();
  }
}
