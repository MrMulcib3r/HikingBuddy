-- PRD v33, FR-23/FR-24: accounts and the signed-in users' data (Cloudflare D1 / SQLite).
-- Applied with `wrangler d1 migrations apply` (npm run db:migrate:local / npm run deploy).
-- Policy (CLAUDE.md "Data storage", rule 8): never edit an applied migration; never drop or
-- rename a table or column without a data migration — add a new numbered file instead.
--
-- Every data table starts with user_id, and its primary key starts with user_id, so every
-- query is scoped to one user and served by the index (no full-table reads, FR-24).
-- deleted_at: deletes are soft (hidden, can be restored by Undo in FR-25).

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  google_sub TEXT NOT NULL UNIQUE,          -- Google's stable account id
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  picture_url TEXT,
  unit_preference TEXT NOT NULL DEFAULT 'metric',
  template_banner_dismissed INTEGER NOT NULL DEFAULT 0,
  data_version INTEGER NOT NULL DEFAULT 0,  -- +1 on every saved change (detects edits from another device)
  created_at TEXT NOT NULL,
  last_login_at TEXT NOT NULL
);

-- One row per signed-in browser. The cookie holds a random token; only its SHA-256 is stored.
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX sessions_by_user ON sessions(user_id);

CREATE TABLE categories (
  user_id TEXT NOT NULL REFERENCES users(id),
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  deleted_at TEXT,
  PRIMARY KEY (user_id, id)
) WITHOUT ROWID;

CREATE TABLE gear_items (
  user_id TEXT NOT NULL REFERENCES users(id),
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  category_id TEXT,
  weight_grams REAL NOT NULL,               -- always grams (FR-3)
  default_quantity INTEGER NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL,
  deleted_at TEXT,
  PRIMARY KEY (user_id, id)
) WITHOUT ROWID;

-- Gearlists and the template (kind = 'template', same shape, PRD 7.5).
CREATE TABLE gear_lists (
  user_id TEXT NOT NULL REFERENCES users(id),
  id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('list', 'template')),
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  deleted_at TEXT,
  PRIMARY KEY (user_id, id)
) WITHOUT ROWID;

-- Rows of a gearlist / template. Worn and Consumable live here, not on the Vault item (FR-9).
CREATE TABLE gear_list_rows (
  user_id TEXT NOT NULL REFERENCES users(id),
  list_id TEXT NOT NULL,
  id TEXT NOT NULL,
  gear_item_id TEXT,                        -- NULL = custom entry, not linked to Gear Vault
  name TEXT NOT NULL,
  category_name TEXT NOT NULL,
  weight_grams REAL NOT NULL,
  quantity INTEGER NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  is_worn INTEGER NOT NULL DEFAULT 0,
  is_consumable INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL,
  deleted_at TEXT,
  PRIMARY KEY (user_id, list_id, id)
) WITHOUT ROWID;

-- One snapshot per gearlist (FR-6): a frozen copy, stored as JSON because it is only ever read whole.
CREATE TABLE snapshots (
  user_id TEXT NOT NULL REFERENCES users(id),
  list_id TEXT NOT NULL,
  saved_at TEXT NOT NULL,
  items_json TEXT NOT NULL,
  deleted_at TEXT,
  PRIMARY KEY (user_id, list_id)
) WITHOUT ROWID;

-- Write guard: a save inserts (user_id, data_version still as expected?) here first. If another
-- device saved in between, ok = 0 breaks the CHECK and the whole save is rolled back and retried.
CREATE TABLE version_guard (
  user_id TEXT PRIMARY KEY,
  ok INTEGER NOT NULL CHECK (ok = 1)
);

-- Fallback rate limiter (FR-24), used only if the Workers Rate Limiting binding is unavailable.
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
);
