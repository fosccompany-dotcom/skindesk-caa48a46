
-- 필러 약제 선택 단계에 "일반 수입필러"와 "국산필러" 옵션 추가
-- 기존과 중복되지 않도록 package_id IS NULL, is_default = true로 추가

-- 먼저 해당 옵션이 이미 있는지 확인하고 없으면 추가
INSERT INTO package_options (id, category, name, name_en, name_zh, sub_type, is_default, sort_order)
VALUES 
  (gen_random_uuid(), '필러·실리프팅', '일반 수입필러', 'Imported Filler (General)', '进口填充剂（普通）', 'drug', true, 1),
  (gen_random_uuid(), '필러·실리프팅', '국산필러', 'Korean Filler', '国产填充剂', 'drug', true, 2)
ON CONFLICT DO NOTHING;
