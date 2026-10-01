-- Delegated access: an administrator can grant a member or sponsor a specific
-- admin capability without making them an administrator.
--
-- Permissions are additive and never widen an admin (who holds all of them by
-- role) nor narrow one. An empty array -- the default -- means the account can
-- reach only its own portal, exactly as before.

ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Lets "who can manage events?" be answered without scanning every row.
CREATE INDEX IF NOT EXISTS users_permissions_idx ON users USING gin (permissions);
