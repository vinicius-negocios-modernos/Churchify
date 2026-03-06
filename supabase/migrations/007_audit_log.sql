-- Migration 007: Create audit_log table with RLS and auto-audit triggers
-- Story 1.14 — Multi-tenancy & Church Isolation (Tasks 2 & 7)

-- 1. Create audit_log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. RLS on audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their church audit log"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM church_members cm
      WHERE cm.church_id = audit_log.church_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND cm.role = 'admin'
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Indexes
CREATE INDEX idx_audit_log_church_id ON audit_log(church_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- 4. Auto-audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (church_id, user_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.church_id,
      auth.uid(),
      'create',
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object('new', to_jsonb(NEW))
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (church_id, user_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.church_id,
      auth.uid(),
      'update',
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (church_id, user_id, action, entity_type, entity_id, details)
    VALUES (
      OLD.church_id,
      auth.uid(),
      'delete',
      TG_TABLE_NAME,
      OLD.id,
      jsonb_build_object('old', to_jsonb(OLD))
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach triggers to key tables
CREATE TRIGGER audit_episodes
  AFTER INSERT OR UPDATE OR DELETE ON episodes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_churches
  AFTER INSERT OR UPDATE OR DELETE ON churches
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_church_members
  AFTER INSERT OR UPDATE OR DELETE ON church_members
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
