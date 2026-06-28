CREATE TABLE IF NOT EXISTS tasks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  assignee   text,
  priority   text NOT NULL DEFAULT 'med' CHECK (priority IN ('high', 'med', 'low')),
  status     text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  due        text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks (status);
