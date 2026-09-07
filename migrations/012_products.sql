-- Product catalogue: GTIN-identified items shown in the portal.

CREATE TABLE IF NOT EXISTS products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gtin        text NOT NULL UNIQUE,
  name        text NOT NULL,
  brand       text,
  category    text,
  description text,
  image_url   text,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  sort        integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_status_idx ON products (status);

INSERT INTO products (gtin, name, brand, category, sort) VALUES
  ('5070004422905', 'Belgian Waffle, Oreo Fresh Double Cream Cup',                     'New York Cheesecake Co.', 'Waffle cups', 10),
  ('5070004422912', 'Belgian Waffle, Raspberry White Chocolate Fresh Double Cream Cup', 'New York Cheesecake Co.', 'Waffle cups', 20),
  ('5070004422929', 'Belgian Waffle, Biscoff Fresh Double Cream Cup',                   'New York Cheesecake Co.', 'Waffle cups', 30),
  ('5070004422936', 'Belgian Waffle, Pistachios Fresh Double Cream Cup',                'New York Cheesecake Co.', 'Waffle cups', 40),
  ('5070004422943', 'Belgian Waffle, Black Forest Fresh Double Cream Cup',              'New York Cheesecake Co.', 'Waffle cups', 50),
  ('5070004422967', 'Belgian Waffle, Banoffee Fresh Double Cream Cup',                  'New York Cheesecake Co.', 'Waffle cups', 60),
  ('5065027203129', 'Double Chocolate Muffin, Fresh Double Cream Cup',                  'New York Cheesecake Co.', 'Cream cups',  70),
  ('5065027203006', 'Apple Cinnamon Cheesecake',                                        'New York Cheesecake Co.', 'Cheesecakes', 80),
  ('5065027203013', 'Biscoff Cheesecake',                                               'New York Cheesecake Co.', 'Cheesecakes', 90),
  ('5065027203020', 'Black Forest Cheesecake',                                          'New York Cheesecake Co.', 'Cheesecakes', 100),
  ('5065027203037', 'Ferrero Rocher Cheesecake',                                        'New York Cheesecake Co.', 'Cheesecakes', 110),
  ('5065027203044', 'Lemon Cheesecake',                                                 'New York Cheesecake Co.', 'Cheesecakes', 120),
  ('5065027203051', 'Mango Cheesecake',                                                 'New York Cheesecake Co.', 'Cheesecakes', 130),
  ('5065027203068', 'Oreo Cheesecake',                                                  'New York Cheesecake Co.', 'Cheesecakes', 140),
  ('5065027203075', 'Raspberry, White Chocolate Cheesecake',                            'New York Cheesecake Co.', 'Cheesecakes', 150)
ON CONFLICT (gtin) DO NOTHING;
