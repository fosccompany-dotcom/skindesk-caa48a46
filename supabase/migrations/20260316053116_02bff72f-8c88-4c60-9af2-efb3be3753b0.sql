
-- Prevent duplicate entries in package_options
-- Use NULLS NOT DISTINCT so NULL package_id values are treated as equal
CREATE UNIQUE INDEX IF NOT EXISTS unique_default_package_option 
  ON package_options (category, name, is_default) 
  WHERE package_id IS NULL AND is_default = true;
