-- 2026-11-09 (BACKLOG Teď 5, schema 8): the default category "Water" is renamed to "Water System".
-- Same rename for signed-in users as migrateV7ToV8 in src/core/schema.ts does for browser data,
-- and the same result as renaming it by hand (RENAME_CATEGORY): the category's name changes and
-- linked gearlist/template rows shown under "Water" follow it. Custom entries (gear_item_id NULL)
-- and snapshots keep their names. Skipped for a user who already has a "Water System" category.
-- data_version +1 so open browsers reload the data instead of keeping the old name.
-- No activity entry: this is an app update, not a change by the user.
-- Order matters: users and rows are matched while the category is still called "Water".

UPDATE users
SET data_version = data_version + 1
WHERE EXISTS (
    SELECT 1 FROM categories c
    WHERE c.user_id = users.id AND c.deleted_at IS NULL AND lower(trim(c.name)) = 'water'
  )
  AND NOT EXISTS (
    SELECT 1 FROM categories c
    WHERE c.user_id = users.id AND c.deleted_at IS NULL AND lower(trim(c.name)) = 'water system'
  );

UPDATE gear_list_rows
SET category_name = 'Water System'
WHERE deleted_at IS NULL
  AND gear_item_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM categories c
    WHERE c.user_id = gear_list_rows.user_id AND c.deleted_at IS NULL
      AND lower(trim(c.name)) = 'water' AND c.name = gear_list_rows.category_name
  )
  AND NOT EXISTS (
    SELECT 1 FROM categories c
    WHERE c.user_id = gear_list_rows.user_id AND c.deleted_at IS NULL AND lower(trim(c.name)) = 'water system'
  );

UPDATE categories
SET name = 'Water System'
WHERE deleted_at IS NULL
  AND lower(trim(name)) = 'water'
  AND NOT EXISTS (
    SELECT 1 FROM categories c
    WHERE c.user_id = categories.user_id AND c.deleted_at IS NULL AND lower(trim(c.name)) = 'water system'
  );
