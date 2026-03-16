
-- "일반 수입필러"를 "수입필러"로 변경
UPDATE package_options 
SET name = '수입필러',
    name_en = 'Imported Filler'
WHERE category = '필러·실리프팅' 
  AND sub_type = 'drug'
  AND name = '일반 수입필러';
