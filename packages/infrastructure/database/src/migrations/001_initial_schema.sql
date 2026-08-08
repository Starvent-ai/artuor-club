CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'local'
);

CREATE TABLE IF NOT EXISTS settings_security (
  id TEXT PRIMARY KEY,
  is_password_set INTEGER NOT NULL DEFAULT 0,
  password_hash TEXT,
  security_question TEXT,
  security_answer_hash TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS table_type (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hourly_rate REAL NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS billiard_table (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  table_type_id TEXT NOT NULL REFERENCES table_type(id),
  status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'in_use')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS table_session (
  id TEXT PRIMARY KEY,
  table_id TEXT NOT NULL REFERENCES billiard_table(id),
  open_tab_id TEXT REFERENCES open_tab(id),
  staff_id TEXT NOT NULL REFERENCES staff(id),
  start_time TEXT NOT NULL,
  end_time TEXT,
  raw_seconds INTEGER,
  billed_minutes INTEGER,
  final_amount REAL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_session_per_table
  ON table_session(table_id)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS device (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('ps4', 'ps5')),
  max_controllers INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'in_use')),
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS device_controller_rate (
  id TEXT PRIMARY KEY,
  device_type TEXT NOT NULL CHECK (device_type IN ('ps4', 'ps5')),
  controller_count INTEGER NOT NULL CHECK (controller_count BETWEEN 1 AND 4),
  hourly_rate REAL NOT NULL,
  UNIQUE (device_type, controller_count)
);

CREATE TABLE IF NOT EXISTS ps_session (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES device(id),
  open_tab_id TEXT REFERENCES open_tab(id),
  staff_id TEXT NOT NULL REFERENCES staff(id),
  start_time TEXT NOT NULL,
  end_time TEXT,
  final_amount REAL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_session_per_device
  ON ps_session(device_id)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS ps_session_segment (
  id TEXT PRIMARY KEY,
  ps_session_id TEXT NOT NULL REFERENCES ps_session(id),
  controller_count INTEGER NOT NULL CHECK (controller_count BETWEEN 1 AND 4),
  segment_start TEXT NOT NULL,
  segment_end TEXT,
  billed_minutes INTEGER,
  segment_amount REAL
);

CREATE TABLE IF NOT EXISTS customer (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS open_tab (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customer(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settled', 'converted_to_ledger')),
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  total_amount REAL NOT NULL DEFAULT 0,
  paid_amount REAL NOT NULL DEFAULT 0,
  staff_id TEXT NOT NULL REFERENCES staff(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_open_tab_per_customer
  ON open_tab(customer_id)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS open_tab_item (
  id TEXT PRIMARY KEY,
  open_tab_id TEXT NOT NULL REFERENCES open_tab(id),
  source_type TEXT NOT NULL CHECK (source_type IN ('table_session', 'ps_session', 'buffet_order')),
  source_id TEXT NOT NULL,
  amount REAL NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payment (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('open_tab', 'ledger_account')),
  target_id TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash', 'pos', 'card_to_card', 'ledger')),
  paid_at TEXT NOT NULL,
  staff_id TEXT NOT NULL REFERENCES staff(id)
);

CREATE TABLE IF NOT EXISTS ledger_account (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customer(id),
  source_type TEXT NOT NULL CHECK (source_type IN ('converted_from_open_tab', 'direct_loan')),
  source_open_tab_id TEXT REFERENCES open_tab(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'settled')),
  total_amount REAL NOT NULL DEFAULT 0,
  paid_amount REAL NOT NULL DEFAULT 0,
  opened_at TEXT NOT NULL,
  settled_at TEXT
);

CREATE TABLE IF NOT EXISTS product_category (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS product (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES product_category(id),
  purchase_price REAL NOT NULL,
  sale_price REAL NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS buffet_order (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('table_session', 'ps_session', 'open_tab', 'immediate_sale')),
  target_id TEXT,
  open_tab_id TEXT REFERENCES open_tab(id),
  total_amount REAL NOT NULL DEFAULT 0,
  is_paid_immediately INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  staff_id TEXT NOT NULL REFERENCES staff(id)
);

CREATE TABLE IF NOT EXISTS buffet_order_item (
  id TEXT PRIMARY KEY,
  buffet_order_id TEXT NOT NULL REFERENCES buffet_order(id),
  product_id TEXT NOT NULL REFERENCES product(id),
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_movement (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES product(id),
  change_quantity INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('sale', 'manual_adjustment', 'initial_stock')),
  reference_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS accounting_transaction (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('table_income', 'ps_income', 'buffet_income', 'expense')),
  source_id TEXT,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'pos', 'card_to_card', 'ledger')),
  description TEXT,
  staff_id TEXT NOT NULL REFERENCES staff(id),
  occurred_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_accounting_transaction_occurred_at ON accounting_transaction(occurred_at);
CREATE INDEX IF NOT EXISTS idx_open_tab_status ON open_tab(status);
CREATE INDEX IF NOT EXISTS idx_ledger_account_status ON ledger_account(status);
CREATE INDEX IF NOT EXISTS idx_customer_full_name ON customer(full_name);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  old_value TEXT,
  new_value TEXT,
  staff_id TEXT REFERENCES staff(id),
  occurred_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS backup_history (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('automatic', 'manual')),
  file_path TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed'))
);
