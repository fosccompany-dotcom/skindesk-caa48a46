-- Add sub_type to existing filler items and insert drug/area options for 2-step filler flow

-- First, update existing filler items to have sub_type = 'area' where they represent areas
UPDATE package_options SET sub_type = 'area' WHERE category = '필러·실리프팅' AND is_default = true AND package_id IS NULL AND sub_type IS NULL AND name IN ('턱끝 필러', '입술 필러', '코 필러', '눈밑 필러', '애교살 필러', '입꼬리 필러', '목주름 필러', '기타 특수부위 필러');

-- Insert drug options for filler
INSERT INTO package_options (category, name, name_en, name_zh, sub_type, is_default, sort_order)
VALUES
  ('필러·실리프팅', '국산 필러', 'Korean Filler', '国产填充剂', 'drug', true, 1),
  ('필러·실리프팅', '수입 필러 (레스틸렌)', 'Restylane', '瑞蓝', 'drug', true, 2),
  ('필러·실리프팅', '수입 필러 (쥬비덤)', 'Juvederm', '乔雅登', 'drug', true, 3),
  ('필러·실리프팅', '아띠에르', 'Atierre', '阿蒂尔', 'drug', true, 4),
  ('필러·실리프팅', '뉴라미스', 'Neuramis', '纽拉米斯', 'drug', true, 5),
  ('필러·실리프팅', '스컬트라', 'Sculptra', '舒颜萃', 'drug', true, 6),
  ('필러·실리프팅', '엘란쎄', 'Ellanse', '依恋诗', 'drug', true, 7)
ON CONFLICT DO NOTHING;

-- Insert area options for filler (if not already present)
INSERT INTO package_options (category, name, name_en, name_zh, sub_type, is_default, sort_order)
VALUES
  ('필러·실리프팅', '이마', 'Forehead', '额头', 'area', true, 10),
  ('필러·실리프팅', '코', 'Nose', '鼻子', 'area', true, 11),
  ('필러·실리프팅', '팔자주름', 'Nasolabial Folds', '法令纹', 'area', true, 12),
  ('필러·실리프팅', '볼', 'Cheeks', '脸颊', 'area', true, 13),
  ('필러·실리프팅', '턱끝', 'Chin', '下巴', 'area', true, 14),
  ('필러·실리프팅', '입술', 'Lips', '嘴唇', 'area', true, 15),
  ('필러·실리프팅', '눈밑', 'Under Eyes', '眼下', 'area', true, 16),
  ('필러·실리프팅', '애교살', 'Aegyo-sal', '卧蚕', 'area', true, 17),
  ('필러·실리프팅', '입꼬리', 'Lip Corners', '嘴角', 'area', true, 18),
  ('필러·실리프팅', '목주름', 'Neck Lines', '颈纹', 'area', true, 19),
  ('필러·실리프팅', '관자놀이', 'Temple', '太阳穴', 'area', true, 20)
ON CONFLICT DO NOTHING;
