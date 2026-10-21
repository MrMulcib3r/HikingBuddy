-- PRD v33/v35, FR-25: change history (Activity) with Undo.
-- One row per entry: one web action, one AI step, one import or one Undo. The entry's
-- description, its single changes and their before/after values are one JSON document
-- (core/history.ts, HistoryEntry), so a change costs one written row (D1 free tier).
-- Kept 30 days; the daily cleanup (worker/index.ts, scheduled) deletes older entries and
-- soft-deleted things older than 30 days.

CREATE TABLE activity (
  user_id TEXT NOT NULL REFERENCES users(id),
  id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  actor TEXT NOT NULL CHECK (actor IN ('you', 'ai')),
  client TEXT,                              -- AI client name ("Claude"); NULL for the user's own changes
  entry_json TEXT NOT NULL,
  PRIMARY KEY (user_id, id)
) WITHOUT ROWID;
CREATE INDEX activity_by_user_time ON activity(user_id, created_at);
CREATE INDEX activity_by_time ON activity(created_at);

-- The daily cleanup finds soft-deleted rows without reading whole tables.
CREATE INDEX categories_deleted ON categories(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX gear_items_deleted ON gear_items(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX gear_lists_deleted ON gear_lists(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX gear_list_rows_deleted ON gear_list_rows(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX snapshots_deleted ON snapshots(deleted_at) WHERE deleted_at IS NOT NULL;
