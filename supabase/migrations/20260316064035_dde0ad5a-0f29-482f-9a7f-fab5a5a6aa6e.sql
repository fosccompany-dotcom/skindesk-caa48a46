
-- 1. Fix drug names: remove origin prefix
UPDATE package_options SET name = '레스틸렌' WHERE id = 'e22330e9-9da6-433a-b665-6d433b3b861f';
UPDATE package_options SET name = '쥬비덤' WHERE id = '40a73fb2-5a80-4151-841a-1d157e0e92c1';

-- 2. Delete generic "국산 필러" and "수입 필러" drug entries (redundant with specific names)
DELETE FROM package_options WHERE id IN ('af7bf696-1b11-493d-a5f8-bcfb9866000f', '82120ac3-82ff-4cc2-b686-017c096fbe89');

-- 3. Delete duplicate area entries that have "필러" suffix (keep the clean ones)
DELETE FROM package_options WHERE id IN (
  '8c25c043-bf8e-4245-ac8c-895f45f08102',  -- 턱끝 필러 (dup of 턱끝)
  '1fb20df2-3ac2-4ac5-8148-389cbeda77b4',  -- 입술 필러 (dup of 입술)
  'b26696f1-b716-4b27-83ec-30b5c120b14d',  -- 코 필러 (dup of 코)
  '0d1a0743-6175-4d7f-bdc2-8b77628a80bb',  -- 눈밑 필러 (dup of 눈밑)
  'd9daca80-62fb-4e06-884c-227c479a1020',  -- 애교살 필러 (dup of 애교살)
  '802c1f21-8bc9-4867-9826-cc90ec7e557b',  -- 입꼬리 필러 (dup of 입꼬리)
  'af168a22-f6a4-4ba5-bdfa-a1a835a248df'   -- 목주름 필러 (dup of 목주름)
);

-- 4. Delete 실리프팅 from area options
DELETE FROM package_options WHERE id = '5b67578b-1f9c-4076-a040-153ef6246ba0';
