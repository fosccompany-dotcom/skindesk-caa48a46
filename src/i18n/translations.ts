export type Language = "ko" | "en" | "zh";

export const LANGUAGE_LABELS: Record<Language, string> = {
  ko: "한국어",
  en: "English",
  zh: "简体中文",
};

type TranslationKeys = {
  // Nav
  nav_home: string;
  nav_list: string;
  nav_packages: string;
  nav_calendar: string;
  nav_my: string;

  // Common
  save: string;
  cancel: string;
  skip: string;
  next: string;
  close: string;
  delete_confirm: string;
  auto_saved: string;
  logout: string;
  login: string;
  signup: string;

  // Auth
  auth_email: string;
  auth_password: string;
  auth_password_confirm: string;
  auth_login_title: string;
  auth_signup_title: string;
  auth_no_account: string;
  auth_has_account: string;
  auth_google: string;
  auth_kakao: string;
  auth_or: string;
  auth_forgot_password: string;
  reset_email_sent: string;
  reset_email_title: string;
  reset_email_submit: string;
  auth_signup_success: string;
  privacy_agree_policy: string;
  privacy_agree_age: string;
  privacy_view_full: string;
  privacy_policy_url: string;
  privacy_start: string;
  terms_title: string;
  terms_url: string;
  privacy_title: string;
  privacy_subtitle: string;
  privacy_sensitive_notice: string;
  delete_account: string;
  delete_account_confirm: string;
  delete_account_desc: string;

  // Onboarding
  onboard_welcome: string;
  onboard_basic_info: string;
  onboard_basic_desc: string;
  onboard_treatment: string;
  onboard_treatment_desc: string;

  // Index — header
  hello: string;
  my_skin_care: string;
  blooming_day: string;
  name_bloom_log: string;
  my_bloom: string;
  current_label: string;
  next_label: string;
  unit_count: string;
  max_rank_achieved: string;
  wilting_message: string;
  first_record_upgrade: string;
  records_grow_skin: string;
  records_until_next: string;
  bloom_complete: string;
  max_stage_achieved: string;

  // Index — condition
  today_condition: string;
  condition_question: string;
  condition_oily: string;
  condition_moist: string;
  condition_clear: string;
  condition_dry: string;
  condition_desert: string;
  condition_memo_placeholder: string;
  record_condition: string;
  condition_record_name: string;
  daily_condition_note: string;
  condition_prefix: string;

  // Index — stats
  treatment_needed: string;
  upcoming_treatment: string;
  maintaining: string;
  held_points: string;
  urgent_treatments: string;
  skin_layer_status: string;
  remaining_vouchers: string;
  treatment_records: string;
  view_all: string;
  fold: string;
  schedule_in_2weeks: string;
  managed_treatments: string;
  count_suffix: string;
  active_clinics: string;
  clinic_suffix: string;
  remaining_sessions: string;
  session_suffix: string;
  remaining_points: string;
  currency_suffix: string;

  // Index — AI parse
  ai_parse_title: string;
  ai_parse_desc: string;

  // Index — calendar & records
  recent_records: string;
  no_record_this_date: string;
  tap_to_add_record: string;
  add_button: string;
  reservation_label: string;
  expiry_soon_title: string;
  expiry_on_date: string;
  expiry_example_suffix: string;
  example_label: string;
  date_selected_suffix: string;
  what_to_add: string;
  add_reservation: string;
  add_treatment_record: string;

  // Index — reward
  reward_title: string;
  reward_desc: string;

  // Index — weekdays
  weekday_sun: string;
  weekday_mon: string;
  weekday_tue: string;
  weekday_wed: string;
  weekday_thu: string;
  weekday_fri: string;
  weekday_sat: string;

  // Index — year/month labels
  year_suffix: string;
  month_suffix: string;

  // Profile
  my_page: string;
  profile_tab: string;
  treatment_history_tab: string;
  basic_info: string;
  skin_type: string;
  birth_date: string;
  select_birth_date: string;
  age_prefix: string;
  age_suffix: string;
  active_regions: string;
  region_desc: string;
  dense_areas: string;
  sido: string;
  gugun: string;
  add_region: string;
  max_region: string;
  care_areas: string;
  main_concerns: string;
  care_goals: string;
  total_records: string;
  avg_satisfaction: string;
  satisfaction: string;
  memo_placeholder: string;
  no_records: string;
  language_setting: string;

  // Skin layers
  epidermis: string;
  dermis: string;
  subcutaneous: string;

  // Body areas
  face: string;
  neck: string;
  arm: string;
  leg: string;
  abdomen: string;
  back: string;
  chest: string;
  hip: string;

  // Skin types
  dry: string;
  oily: string;
  combination: string;
  sensitive: string;
  normal: string;

  // Concerns
  concern_pores: string;
  concern_pigment: string;
  concern_elasticity: string;
  concern_wrinkles: string;
  concern_acne: string;
  concern_redness: string;
  concern_dryness: string;
  concern_dark_circles: string;
  concern_hair_removal: string;
  concern_cellulite: string;
  concern_stretch_marks: string;

  // Goals
  goal_bright_skin: string;
  goal_pore_reduction: string;
  goal_elasticity: string;
  goal_wrinkle: string;
  goal_trouble: string;
  goal_moisture: string;
  goal_body_line: string;
  goal_hair_removal: string;

  // Points
  balance: string;
  cumulative_spent: string;

  // Treatments page
  treatment_list: string;

  // Cycles
  cycles_title: string;

  // Calendar
  calendar_title: string;

  // Packages
  packages_title: string;

  // Status
  status_title: string;
};

const ko: TranslationKeys = {
  nav_home: "홈",
  nav_list: "리스트",
  nav_packages: "시술권",
  nav_calendar: "시술내역",
  nav_my: "마이",

  save: "저장",
  cancel: "취소",
  skip: "건너뛰기",
  next: "다음",
  close: "닫기",
  delete_confirm: "이 시술 기록을 삭제할까요?",
  auto_saved: "✓ 자동 저장됨",
  logout: "로그아웃",
  login: "로그인",
  signup: "회원가입",

  auth_email: "이메일",
  auth_password: "비밀번호",
  auth_password_confirm: "비밀번호 확인",
  auth_login_title: "로그인",
  auth_signup_title: "회원가입",
  auth_no_account: "계정이 없으신가요?",
  auth_has_account: "이미 계정이 있으신가요?",
  auth_google: "Google로 계속하기",
  auth_kakao: "카카오로 계속하기",
  auth_or: "또는",
  auth_forgot_password: "비밀번호를 잊으셨나요?",
  reset_email_sent: "이메일을 확인해주세요",
  reset_email_title: "비밀번호 재설정",
  reset_email_submit: "재설정 링크 발송",
  auth_signup_success: "가입 확인 이메일을 보냈습니다. 이메일을 확인해주세요.",
  privacy_agree_policy: "[필수] 개인정보처리방침에 동의합니다",
  privacy_agree_age: "[필수] 만 14세 이상입니다",
  privacy_view_full: "전문 보기",
  privacy_policy_url: "https://bloomlog.io/privacy",
  privacy_start: "동의하고 시작하기",
  terms_title: "이용약관",
  terms_url: "/terms",
  privacy_title: "개인정보처리방침",
  privacy_subtitle: "Bloomlog는 시술 기록을 안전하게 보관합니다",
  privacy_sensitive_notice:
    "시술 기록은 건강에 관한 민감정보입니다. 본인 동의 하에만 수집되며, 서비스 제공 외 목적으로 사용되지 않습니다.",
  delete_account: "회원 탈퇴",
  delete_account_confirm: "정말 탈퇴하시겠어요?",
  delete_account_desc: "모든 시술 기록이 영구 삭제됩니다. 되돌릴 수 없습니다.",

  onboard_welcome: "환영합니다! 🎉",
  onboard_basic_info: "기본 정보를 입력해주세요",
  onboard_basic_desc: "피부 타입과 관심 부위를 알려주시면 맞춤 관리를 도와드립니다.",
  onboard_treatment: "시술 기록을 등록해보세요",
  onboard_treatment_desc: "최근 받은 시술을 기록하면 주기 관리를 시작할 수 있어요.",

  hello: "안녕하세요 👋",
  my_skin_care: "나의 피부 관리",
  blooming_day: "It's ​Blooming day!",
  name_bloom_log: "님의",
  my_bloom: "🌱 나의 Bloom",
  current_label: "현재:",
  next_label: "다음:",
  unit_count: "건",
  max_rank_achieved: "✨ 최고 등급 달성!",
  wilting_message: "🥀 조금 시들고 있어요… 다시 기록해볼까요?",
  first_record_upgrade: "첫번째 기록 완료하고 새싹이로 업그레이드 해요!",
  records_grow_skin: "기록이 쌓일수록 내 피부가 보여요 🌱",
  records_until_next: "번만 더 기록하면",
  bloom_complete: "완성!",
  max_stage_achieved: "✨ 최고 단계 달성!!!",

  today_condition: "오늘의 컨디션 기록",
  condition_question: "오늘 피부 컨디션은 어떤가요?",
  condition_oily: "기름",
  condition_moist: "촉촉",
  condition_clear: "맑음",
  condition_dry: "건조",
  condition_desert: "사막",
  condition_memo_placeholder: "오늘 피부 상태 메모 (선택)",
  record_condition: "컨디션 기록하기",
  condition_record_name: "컨디션 기록",
  daily_condition_note: "일일 컨디션 기록",
  condition_prefix: "컨디션:",

  treatment_needed: "시술 필요",
  upcoming_treatment: "곧 시술",
  maintaining: "유지 중",
  held_points: "보유 포인트",
  urgent_treatments: "급한 시술",
  skin_layer_status: "피부층별 관리 현황",
  remaining_vouchers: "시술권 잔여 현황",
  treatment_records: "시술 기록",
  view_all: "전체보기",
  fold: "접기",
  schedule_in_2weeks: "2주 내 예정 일정",
  managed_treatments: "관리중인 시술",
  count_suffix: "개",
  active_clinics: "이용중인 병원",
  clinic_suffix: "곳",
  remaining_sessions: "남은 시술 횟수",
  session_suffix: "회",
  remaining_points: "잔여 포인트",
  currency_suffix: "원",

  ai_parse_title: "✨ 시술 기록 한 번에 추가하기",
  ai_parse_desc: "카톡·문자 붙여넣기만 하면 끝",

  recent_records: "최근 기록",
  no_record_this_date: "이 날짜에 기록이 없어요",
  tap_to_add_record: "탭하여 예약일정과 시술기록을 추가하세요",
  add_button: "추가",
  reservation_label: "예약",
  expiry_soon_title: "시술권 유효기간이 곧 끝나요!",
  expiry_on_date: "에 유효기간 만료",
  expiry_example_suffix: "에 만료 예정 (예시)",
  example_label: "예시",
  date_selected_suffix: "을 선택하셨어요",
  what_to_add: "무엇을 추가하시겠어요?",
  add_reservation: "예약 일정 추가",
  add_treatment_record: "시술 내역 추가",

  reward_title: "기록 완료!",
  reward_desc: "꾸준히 기록하면 Bloom이 성장해요 🌱",

  weekday_sun: "일",
  weekday_mon: "월",
  weekday_tue: "화",
  weekday_wed: "수",
  weekday_thu: "목",
  weekday_fri: "금",
  weekday_sat: "토",

  year_suffix: "년",
  month_suffix: "월",

  my_page: "마이페이지",
  profile_tab: "프로필",
  treatment_history_tab: "시술 기록",
  basic_info: "기본 정보",
  skin_type: "피부 타입",
  birth_date: "생년월일",
  select_birth_date: "생년월일 선택",
  age_prefix: "만 ",
  age_suffix: "세",
  active_regions: "주요 활동 지역",
  region_desc: "병원 추천 시 활용됩니다 · 최대 3개",
  dense_areas: "피부과 밀집 지역",
  sido: "시/도",
  gugun: "시/군/구",
  add_region: "지역 추가",
  max_region: "최대 3개 지역까지 등록할 수 있습니다",
  care_areas: "관리 부위",
  main_concerns: "주요 고민",
  care_goals: "관리 목표",
  total_records: "총 시술 기록",
  avg_satisfaction: "평균 만족도",
  satisfaction: "만족도",
  memo_placeholder: "시술 경험, 효과, 주의사항 등을 기록해보세요...",
  no_records: "아직 시술 기록이 없습니다",
  language_setting: "언어 설정",

  epidermis: "표피",
  dermis: "진피",
  subcutaneous: "피하",

  face: "얼굴",
  neck: "목",
  arm: "팔",
  leg: "다리",
  abdomen: "복부",
  back: "등",
  chest: "가슴",
  hip: "엉덩이",

  dry: "건성",
  oily: "지성",
  combination: "복합성",
  sensitive: "민감성",
  normal: "중성",

  concern_pores: "모공",
  concern_pigment: "색소침착",
  concern_elasticity: "탄력저하",
  concern_wrinkles: "주름",
  concern_acne: "여드름",
  concern_redness: "홍조",
  concern_dryness: "건조",
  concern_dark_circles: "다크서클",
  concern_hair_removal: "제모",
  concern_cellulite: "셀룰라이트",
  concern_stretch_marks: "튼살",

  goal_bright_skin: "맑은 피부톤",
  goal_pore_reduction: "모공 축소",
  goal_elasticity: "탄력 개선",
  goal_wrinkle: "주름 개선",
  goal_trouble: "트러블 완화",
  goal_moisture: "보습 강화",
  goal_body_line: "바디라인 정리",
  goal_hair_removal: "제모 완료",

  balance: "잔액",
  cumulative_spent: "누적 지출",

  treatment_list: "시술 리스트",
  cycles_title: "시술 주기 관리",
  calendar_title: "캘린더",
  packages_title: "시술권",
  status_title: "시술 현황",
};

const en: TranslationKeys = {
  nav_home: "Home",
  nav_list: "List",
  nav_packages: "Vouchers",
  nav_calendar: "Calendar",
  nav_my: "My",

  save: "Save",
  cancel: "Cancel",
  skip: "Skip",
  next: "Next",
  close: "Close",
  delete_confirm: "Delete this treatment record?",
  auto_saved: "✓ Auto-saved",
  logout: "Log Out",
  login: "Log In",
  signup: "Sign Up",

  auth_email: "Email",
  auth_password: "Password",
  auth_password_confirm: "Confirm Password",
  auth_login_title: "Log In",
  auth_signup_title: "Sign Up",
  auth_no_account: "Don't have an account?",
  auth_has_account: "Already have an account?",
  auth_google: "Continue with Google",
  auth_kakao: "Continue with Kakao",
  auth_or: "or",
  auth_forgot_password: "Forgot password?",
  reset_email_sent: "Check your email",
  reset_email_title: "Reset Password",
  reset_email_submit: "Send reset link",
  auth_signup_success: "A confirmation email has been sent. Please check your inbox.",
  privacy_agree_policy: "[Required] I agree to the Privacy Policy",
  privacy_agree_age: "[Required] I am 14 years of age or older",
  privacy_view_full: "View full policy",
  privacy_policy_url: "https://bloomlog.io/privacy",
  privacy_start: "Agree and get started",
  terms_title: "Terms of Service",
  terms_url: "/terms",
  privacy_title: "Privacy Policy",
  privacy_subtitle: "Bloomlog securely stores your treatment records",
  privacy_sensitive_notice:
    "Treatment records are sensitive health information. They are collected only with your consent and are not used for purposes other than providing the service.",
  delete_account: "Delete Account",
  delete_account_confirm: "Delete your account?",
  delete_account_desc: "All records will be permanently deleted. This cannot be undone.",

  onboard_welcome: "Welcome! 🎉",
  onboard_basic_info: "Enter your basic info",
  onboard_basic_desc: "Tell us your skin type and areas of interest for personalized care.",
  onboard_treatment: "Log your treatments",
  onboard_treatment_desc: "Record recent treatments to start managing your care cycles.",

  hello: "Hello 👋",
  my_skin_care: "My Skin Care",
  blooming_day: "It's Blooming day!",
  name_bloom_log: "'s",
  my_bloom: "🌱 My Bloom",
  current_label: "Current:",
  next_label: "Next:",
  unit_count: "",
  max_rank_achieved: "✨ Max rank achieved!",
  wilting_message: "🥀 Your bloom is wilting… Let's log again!",
  first_record_upgrade: "Complete your first log to level up to Sprout!",
  records_grow_skin: "More logs reveal more about your skin 🌱",
  records_until_next: "more logs until",
  bloom_complete: "complete!",
  max_stage_achieved: "✨ Max stage achieved!!!",

  today_condition: "Today's Skin Condition",
  condition_question: "How's your skin today?",
  condition_oily: "Oily",
  condition_moist: "Moist",
  condition_clear: "Clear",
  condition_dry: "Dry",
  condition_desert: "Parched",
  condition_memo_placeholder: "Skin condition memo (optional)",
  record_condition: "Log Condition",
  condition_record_name: "Condition Log",
  daily_condition_note: "Daily condition log",
  condition_prefix: "Condition:",

  treatment_needed: "Needs Care",
  upcoming_treatment: "Upcoming",
  maintaining: "On Track",
  held_points: "Points Balance",
  urgent_treatments: "Urgent Treatments",
  skin_layer_status: "Skin Layer Status",
  remaining_vouchers: "Remaining Vouchers",
  treatment_records: "Treatment Records",
  view_all: "View All",
  fold: "Collapse",
  schedule_in_2weeks: "Upcoming in 2 Weeks",
  managed_treatments: "Active Treatments",
  count_suffix: "",
  active_clinics: "Active Clinics",
  clinic_suffix: "",
  remaining_sessions: "Remaining Sessions",
  session_suffix: "",
  remaining_points: "Points Balance",
  currency_suffix: "pts",

  ai_parse_title: "✨ Bulk Add Treatment Records",
  ai_parse_desc: "Just paste from chat or text messages",

  recent_records: "Recent Records",
  no_record_this_date: "No records on this date",
  tap_to_add_record: "Tap to add reservations or treatment records",
  add_button: "Add",
  reservation_label: "Reserved",
  expiry_soon_title: "Voucher expiring soon!",
  expiry_on_date: " — expires",
  expiry_example_suffix: " — expiring (example)",
  example_label: "Example",
  date_selected_suffix: " selected",
  what_to_add: "What would you like to add?",
  add_reservation: "Add Reservation",
  add_treatment_record: "Add Treatment Record",

  reward_title: "Record saved!",
  reward_desc: "Keep logging to grow your Bloom 🌱",

  weekday_sun: "Sun",
  weekday_mon: "Mon",
  weekday_tue: "Tue",
  weekday_wed: "Wed",
  weekday_thu: "Thu",
  weekday_fri: "Fri",
  weekday_sat: "Sat",

  year_suffix: "",
  month_suffix: "",

  my_page: "My Page",
  profile_tab: "Profile",
  treatment_history_tab: "History",
  basic_info: "Basic Info",
  skin_type: "Skin Type",
  birth_date: "Date of Birth",
  select_birth_date: "Select date of birth",
  age_prefix: "Age ",
  age_suffix: "",
  active_regions: "Active Regions",
  region_desc: "Used for clinic recommendations · Max 7",
  dense_areas: "Popular clinic areas",
  sido: "Province",
  gugun: "City/District",
  add_region: "Add Region",
  max_region: "You can register up to 5 regions",
  care_areas: "Care Areas",
  main_concerns: "Main Concerns",
  care_goals: "Care Goals",
  total_records: "Total Records",
  avg_satisfaction: "Avg Satisfaction",
  satisfaction: "Satisfaction",
  memo_placeholder: "Record your experience, effects, precautions...",
  no_records: "No treatment records yet",
  language_setting: "Language",

  epidermis: "Epidermis",
  dermis: "Dermis",
  subcutaneous: "Subcutaneous",

  face: "Face",
  neck: "Neck",
  arm: "Arm",
  leg: "Leg",
  abdomen: "Abdomen",
  back: "Back",
  chest: "Chest",
  hip: "Hip",

  dry: "Dry",
  oily: "Oily",
  combination: "Combination",
  sensitive: "Sensitive",
  normal: "Normal",

  concern_pores: "Pores",
  concern_pigment: "Pigmentation",
  concern_elasticity: "Loss of Elasticity",
  concern_wrinkles: "Wrinkles",
  concern_acne: "Acne",
  concern_redness: "Redness",
  concern_dryness: "Dryness",
  concern_dark_circles: "Dark Circles",
  concern_hair_removal: "Hair Removal",
  concern_cellulite: "Cellulite",
  concern_stretch_marks: "Stretch Marks",

  goal_bright_skin: "Bright Skin Tone",
  goal_pore_reduction: "Pore Reduction",
  goal_elasticity: "Improve Elasticity",
  goal_wrinkle: "Wrinkle Reduction",
  goal_trouble: "Trouble Relief",
  goal_moisture: "Boost Moisture",
  goal_body_line: "Body Contouring",
  goal_hair_removal: "Complete Hair Removal",

  balance: "Balance",
  cumulative_spent: "Total Spent",

  treatment_list: "Treatment List",
  cycles_title: "Cycle Management",
  calendar_title: "Calendar",
  packages_title: "Vouchers",
  status_title: "Treatment Status",
};

const zh: TranslationKeys = {
  nav_home: "首页",
  nav_list: "列表",
  nav_packages: "疗程券",
  nav_calendar: "日历",
  nav_my: "我的",

  save: "保存",
  cancel: "取消",
  skip: "跳过",
  next: "下一步",
  close: "关闭",
  delete_confirm: "确定删除此治疗记录？",
  auto_saved: "✓ 已自动保存",
  logout: "退出登录",
  login: "登录",
  signup: "注册",

  auth_email: "邮箱",
  auth_password: "密码",
  auth_password_confirm: "确认密码",
  auth_login_title: "登录",
  auth_signup_title: "注册",
  auth_no_account: "还没有账号？",
  auth_has_account: "已有账号？",
  auth_google: "使用Google继续",
  auth_kakao: "使用Kakao继续",
  auth_or: "或",
  auth_forgot_password: "忘记密码？",
  reset_email_sent: "请检查您的邮箱",
  reset_email_title: "重置密码",
  reset_email_submit: "发送重置链接",
  auth_signup_success: "确认邮件已发送，请查收。",
  privacy_agree_policy: "[必须] 我同意隐私政策",
  privacy_agree_age: "[必须] 我已年满14周岁",
  privacy_view_full: "查看全文",
  privacy_policy_url: "https://bloomlog.io/privacy",
  privacy_start: "同意并开始",
  terms_title: "使用条款",
  terms_url: "/terms",
  privacy_title: "隐私政策",
  privacy_subtitle: "Bloomlog安全保管您的治疗记录",
  privacy_sensitive_notice: "治疗记录是与健康相关的敏感信息。仅在您同意的情况下收集，不会用于服务提供以外的目的。",
  delete_account: "注销账户",
  delete_account_confirm: "确认注销？",
  delete_account_desc: "所有记录将被永久删除，此操作无法撤销。",

  onboard_welcome: "欢迎！🎉",
  onboard_basic_info: "请填写基本信息",
  onboard_basic_desc: "告诉我们您的肤质和关注部位，为您提供个性化护理建议。",
  onboard_treatment: "记录您的治疗",
  onboard_treatment_desc: "记录最近的治疗以开始周期管理。",

  hello: "您好 👋",
  my_skin_care: "我的皮肤管理",
  blooming_day: "It's Blooming day!",
  name_bloom_log: "的",
  my_bloom: "🌱 我的 Bloom",
  current_label: "当前:",
  next_label: "下一阶段:",
  unit_count: "条",
  max_rank_achieved: "✨ 已达最高等级！",
  wilting_message: "🥀 有些枯萎了…再来记录一下吧！",
  first_record_upgrade: "完成第一条记录升级为嫩芽！",
  records_grow_skin: "记录越多，越了解您的肌肤 🌱",
  records_until_next: "条记录即可达到",
  bloom_complete: "！",
  max_stage_achieved: "✨ 已达最高阶段！！！",

  today_condition: "今日肌肤状态",
  condition_question: "今天肌肤状态如何？",
  condition_oily: "油腻",
  condition_moist: "水润",
  condition_clear: "通透",
  condition_dry: "干燥",
  condition_desert: "极干",
  condition_memo_placeholder: "今日肌肤状态备注（选填）",
  record_condition: "记录状态",
  condition_record_name: "状态记录",
  daily_condition_note: "每日状态记录",
  condition_prefix: "状态:",

  treatment_needed: "需要治疗",
  upcoming_treatment: "即将治疗",
  maintaining: "维持中",
  held_points: "积分余额",
  urgent_treatments: "紧急治疗",
  skin_layer_status: "皮肤层管理状态",
  remaining_vouchers: "疗程券剩余",
  treatment_records: "治疗记录",
  view_all: "查看全部",
  fold: "收起",
  schedule_in_2weeks: "两周内预定",
  managed_treatments: "管理中的治疗",
  count_suffix: "项",
  active_clinics: "使用中的医院",
  clinic_suffix: "家",
  remaining_sessions: "剩余治疗次数",
  session_suffix: "次",
  remaining_points: "剩余积分",
  currency_suffix: "元",

  ai_parse_title: "✨ 批量添加治疗记录",
  ai_parse_desc: "粘贴聊天记录即可完成",

  recent_records: "最近记录",
  no_record_this_date: "此日期暂无记录",
  tap_to_add_record: "点击添加预约和治疗记录",
  add_button: "添加",
  reservation_label: "已预约",
  expiry_soon_title: "疗程券即将到期！",
  expiry_on_date: "有效期届满",
  expiry_example_suffix: "即将到期（示例）",
  example_label: "示例",
  date_selected_suffix: "已选择",
  what_to_add: "您想添加什么？",
  add_reservation: "添加预约",
  add_treatment_record: "添加治疗记录",

  reward_title: "记录完成！",
  reward_desc: "持续记录，Bloom 会成长 🌱",

  weekday_sun: "日",
  weekday_mon: "一",
  weekday_tue: "二",
  weekday_wed: "三",
  weekday_thu: "四",
  weekday_fri: "五",
  weekday_sat: "六",

  year_suffix: "年",
  month_suffix: "月",

  my_page: "个人中心",
  profile_tab: "资料",
  treatment_history_tab: "治疗记录",
  basic_info: "基本信息",
  skin_type: "肤质",
  birth_date: "出生日期",
  select_birth_date: "选择出生日期",
  age_prefix: "",
  age_suffix: "岁",
  active_regions: "主要活动区域",
  region_desc: "用于医院推荐 · 最多7个",
  dense_areas: "热门医院区域",
  sido: "省/市",
  gugun: "区/县",
  add_region: "添加区域",
  max_region: "最多可注册5个区域",
  care_areas: "管理部位",
  main_concerns: "主要关注",
  care_goals: "管理目标",
  total_records: "总治疗记录",
  avg_satisfaction: "平均满意度",
  satisfaction: "满意度",
  memo_placeholder: "记录治疗体验、效果、注意事项...",
  no_records: "暂无治疗记录",
  language_setting: "语言设置",

  epidermis: "表皮",
  dermis: "真皮",
  subcutaneous: "皮下",

  face: "面部",
  neck: "颈部",
  arm: "手臂",
  leg: "腿部",
  abdomen: "腹部",
  back: "背部",
  chest: "胸部",
  hip: "臀部",

  dry: "干性",
  oily: "油性",
  combination: "混合性",
  sensitive: "敏感性",
  normal: "中性",

  concern_pores: "毛孔",
  concern_pigment: "色素沉着",
  concern_elasticity: "弹性下降",
  concern_wrinkles: "皱纹",
  concern_acne: "痘痘",
  concern_redness: "泛红",
  concern_dryness: "干燥",
  concern_dark_circles: "黑眼圈",
  concern_hair_removal: "脱毛",
  concern_cellulite: "橘皮组织",
  concern_stretch_marks: "妊娠纹",

  goal_bright_skin: "透亮肤色",
  goal_pore_reduction: "缩小毛孔",
  goal_elasticity: "改善弹性",
  goal_wrinkle: "改善皱纹",
  goal_trouble: "缓解肌肤问题",
  goal_moisture: "加强保湿",
  goal_body_line: "身体塑形",
  goal_hair_removal: "完成脱毛",

  balance: "余额",
  cumulative_spent: "累计支出",

  treatment_list: "治疗列表",
  cycles_title: "周期管理",
  calendar_title: "日历",
  packages_title: "疗程券",
  status_title: "治疗状态",
};

export const translations: Record<Language, TranslationKeys> = { ko, en, zh };
