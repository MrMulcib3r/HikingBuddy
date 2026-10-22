-- PRD v33/v38, FR-27: proposals of changes shown in the AI chat widget (WidgetProposedChanges).
-- The AI proposes, nothing changes until the user confirms a row in the widget. The server keeps
-- the proposal so that
--   - the widget can only confirm what the AI proposed (it sends a change id, not data),
--   - a reopened chat shows which rows are already confirmed or rejected,
--   - a double click never saves a change twice.
-- The proposal (its changes, their state and the data fingerprint for "out of date") is one JSON
-- document. Not part of AppState: no schema version change. Kept 30 days (daily cleanup).

CREATE TABLE proposals (
  user_id TEXT NOT NULL REFERENCES users(id),
  id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  proposal_json TEXT NOT NULL,
  PRIMARY KEY (user_id, id)
) WITHOUT ROWID;
CREATE INDEX proposals_by_time ON proposals(created_at);
