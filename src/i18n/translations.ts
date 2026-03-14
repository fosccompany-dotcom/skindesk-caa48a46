export type Language = 'ko' | 'en' | 'zh';

export const LANGUAGE_LABELS: Record<Language, string> = {
  ko: '한국어',
  en: 'English',
  zh: '简体中文',
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
  delete_account: string;
  delete_account_confirm: string;
  delete_account_desc: string;

  // Onboarding
  onboard_welcome: string;
  onboard_basic_info: string;
  onboard_basic_desc: string;
  onboard_treatment: string;
  onboard_treatment_desc: string;

  // Index
  hello: string;
  my_skin_care: string;
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
  nav_home: '홈',
  nav_list: '리스트',
  nav_packages: '시술권',
  nav_calendar: '시술내역',
  nav_my: '마이',

  save: '저장',
  cancel: '취소',
  skip: '건너뛰기',
  next: '다음',
  close: '닫기',
  delete_confirm: '이 시술 기록을 삭제할까요?',
  auto_saved: '✓ 자동 저장됨',
  logout: '로그아웃',
  login: '로그인',
  signup: '회원가입',

  auth_email: '이메일',
  auth_password: '비밀번호',
  auth_password_confirm: '비밀번호 확인',
  auth_login_title: '로그인',
  auth_signup_title: '회원가입',
  auth_no_account: '계정이 없으신가요?',
  auth_has_account: '이미 계정이 있으신가요?',
  auth_google: 'Google로 계속하기',
  auth_kakao: '카카오로 계속하기',
  auth_or: '또는',
  auth_forgot_password: '비밀번호를 잊으셨나요?',
  reset_email_sent: '이메일을 확인해주세요',
  reset_email_title: '비밀번호 재설정',
  reset_email_submit: '재설정 링크 발송',
  auth_signup_success: '가입 확인 이메일을 보냈습니다. 이메일을 확인해주세요.',
  privacy_agree_policy: '[필수] 개인정보처리방침에 동의합니다',
  privacy_agree_age: '[필수] 만 14세 이상입니다',
  privacy_view_full: '전문 보기',
  privacy_policy_url: 'https://bloomlog.io/privacy',
  privacy_start: '동의하고 시작하기',
  terms_title: '이용약관',
  terms_url: '/terms',
  privacy_title: '개인정보처리방침',

  onboard_welcome: '환영합니다! 🎉',
  onboard_basic_info: '기본 정보를 입력해주세요',
  onboard_basic_desc: '피부 타입과 관심 부위를 알려주시면 맞춤 관리를 도와드립니다.',
  onboard_treatment: '시술 기록을 등록해보세요',
  onboard_treatment_desc: '최근 받은 시술을 기록하면 주기 관리를 시작할 수 있어요.',

  hello: '안녕하세요 👋',
  my_skin_care: '나의 피부 관리',
  treatment_needed: '시술 필요',
  upcoming_treatment: '곧 시술',
  maintaining: '유지 중',
  held_points: '보유 포인트',
  urgent_treatments: '급한 시술',
  skin_layer_status: '피부층별 관리 현황',
  remaining_vouchers: '시술권 잔여 현황',
  treatment_records: '시술 기록',
  view_all: '전체보기',
  fold: '접기',
  schedule_in_2weeks: '2주 내 예정 일정',

  my_page: '마이페이지',
  profile_tab: '프로필',
  treatment_history_tab: '시술 기록',
  basic_info: '기본 정보',
  skin_type: '피부 타입',
  birth_date: '생년월일',
  select_birth_date: '생년월일 선택',
  age_prefix: '만 ',
  age_suffix: '세',
  active_regions: '주요 활동 지역',
  region_desc: '병원 추천 시 활용됩니다 · 최대 7개',
  dense_areas: '피부과 밀집 지역',
  sido: '시/도',
  gugun: '시/군/구',
  add_region: '지역 추가',
  max_region: '최대 7개 지역까지 등록할 수 있습니다',
  care_areas: '관리 부위',
  main_concerns: '주요 고민',
  care_goals: '관리 목표',
  total_records: '총 시술 기록',
  avg_satisfaction: '평균 만족도',
  satisfaction: '만족도',
  memo_placeholder: '시술 경험, 효과, 주의사항 등을 기록해보세요...',
  no_records: '아직 시술 기록이 없습니다',
  language_setting: '언어 설정',

  epidermis: '표피',
  dermis: '진피',
  subcutaneous: '피하',

  face: '얼굴',
  neck: '목',
  arm: '팔',
  leg: '다리',
  abdomen: '복부',
  back: '등',
  chest: '가슴',
  hip: '엉덩이',

  dry: '건성',
  oily: '지성',
  combination: '복합성',
  sensitive: '민감성',
  normal: '중성',

  concern_pores: '모공',
  concern_pigment: '색소침착',
  concern_elasticity: '탄력저하',
  concern_wrinkles: '주름',
  concern_acne: '여드름',
  concern_redness: '홍조',
  concern_dryness: '건조',
  concern_dark_circles: '다크서클',
  concern_hair_removal: '제모',
  concern_cellulite: '셀룰라이트',
  concern_stretch_marks: '튼살',

  goal_bright_skin: '맑은 피부톤',
  goal_pore_reduction: '모공 축소',
  goal_elasticity: '탄력 개선',
  goal_wrinkle: '주름 개선',
  goal_trouble: '트러블 완화',
  goal_moisture: '보습 강화',
  goal_body_line: '바디라인 정리',
  goal_hair_removal: '제모 완료',

  balance: '잔액',
  cumulative_spent: '누적 지출',

  treatment_list: '시술 리스트',
  cycles_title: '시술 주기 관리',
  calendar_title: '캘린더',
  packages_title: '시술권',
  status_title: '시술 현황',
};

const en: TranslationKeys = {
  nav_home: 'Home',
  nav_list: 'List',
  nav_packages: 'Vouchers',
  nav_calendar: 'Calendar',
  nav_my: 'My',

  save: 'Save',
  cancel: 'Cancel',
  skip: 'Skip',
  next: 'Next',
  close: 'Close',
  delete_confirm: 'Delete this treatment record?',
  auto_saved: '✓ Auto-saved',
  logout: 'Log Out',
  login: 'Log In',
  signup: 'Sign Up',

  auth_email: 'Email',
  auth_password: 'Password',
  auth_password_confirm: 'Confirm Password',
  auth_login_title: 'Log In',
  auth_signup_title: 'Sign Up',
  auth_no_account: "Don't have an account?",
  auth_has_account: 'Already have an account?',
  auth_google: 'Continue with Google',
  auth_kakao: 'Continue with Kakao',
  auth_or: 'or',
  auth_forgot_password: 'Forgot password?',
  reset_email_sent: 'Check your email',
  reset_email_title: 'Reset Password',
  reset_email_submit: 'Send reset link',
  auth_signup_success: 'A confirmation email has been sent. Please check your inbox.',

  onboard_welcome: 'Welcome! 🎉',
  onboard_basic_info: 'Enter your basic info',
  onboard_basic_desc: 'Tell us your skin type and areas of interest for personalized care.',
  onboard_treatment: 'Log your treatments',
  onboard_treatment_desc: 'Record recent treatments to start managing your care cycles.',

  hello: 'Hello 👋',
  my_skin_care: 'My Skin Care',
  treatment_needed: 'Needs Care',
  upcoming_treatment: 'Upcoming',
  maintaining: 'On Track',
  held_points: 'Points Balance',
  urgent_treatments: 'Urgent Treatments',
  skin_layer_status: 'Skin Layer Status',
  remaining_vouchers: 'Remaining Vouchers',
  treatment_records: 'Treatment Records',
  view_all: 'View All',
  fold: 'Collapse',
  schedule_in_2weeks: 'Upcoming in 2 Weeks',

  my_page: 'My Page',
  profile_tab: 'Profile',
  treatment_history_tab: 'History',
  basic_info: 'Basic Info',
  skin_type: 'Skin Type',
  birth_date: 'Date of Birth',
  select_birth_date: 'Select date of birth',
  age_prefix: 'Age ',
  age_suffix: '',
  active_regions: 'Active Regions',
  region_desc: 'Used for clinic recommendations · Max 7',
  dense_areas: 'Popular clinic areas',
  sido: 'Province',
  gugun: 'City/District',
  add_region: 'Add Region',
  max_region: 'You can register up to 7 regions',
  care_areas: 'Care Areas',
  main_concerns: 'Main Concerns',
  care_goals: 'Care Goals',
  total_records: 'Total Records',
  avg_satisfaction: 'Avg Satisfaction',
  satisfaction: 'Satisfaction',
  memo_placeholder: 'Record your experience, effects, precautions...',
  no_records: 'No treatment records yet',
  language_setting: 'Language',

  epidermis: 'Epidermis',
  dermis: 'Dermis',
  subcutaneous: 'Subcutaneous',

  face: 'Face',
  neck: 'Neck',
  arm: 'Arm',
  leg: 'Leg',
  abdomen: 'Abdomen',
  back: 'Back',
  chest: 'Chest',
  hip: 'Hip',

  dry: 'Dry',
  oily: 'Oily',
  combination: 'Combination',
  sensitive: 'Sensitive',
  normal: 'Normal',

  concern_pores: 'Pores',
  concern_pigment: 'Pigmentation',
  concern_elasticity: 'Loss of Elasticity',
  concern_wrinkles: 'Wrinkles',
  concern_acne: 'Acne',
  concern_redness: 'Redness',
  concern_dryness: 'Dryness',
  concern_dark_circles: 'Dark Circles',
  concern_hair_removal: 'Hair Removal',
  concern_cellulite: 'Cellulite',
  concern_stretch_marks: 'Stretch Marks',

  goal_bright_skin: 'Bright Skin Tone',
  goal_pore_reduction: 'Pore Reduction',
  goal_elasticity: 'Improve Elasticity',
  goal_wrinkle: 'Wrinkle Reduction',
  goal_trouble: 'Trouble Relief',
  goal_moisture: 'Boost Moisture',
  goal_body_line: 'Body Contouring',
  goal_hair_removal: 'Complete Hair Removal',

  balance: 'Balance',
  cumulative_spent: 'Total Spent',

  treatment_list: 'Treatment List',
  cycles_title: 'Cycle Management',
  calendar_title: 'Calendar',
  packages_title: 'Vouchers',
  status_title: 'Treatment Status',
  privacy_agree_policy: '[Required] I agree to the Privacy Policy',
  privacy_agree_age: '[Required] I am 14 years of age or older',
  privacy_view_full: 'View full policy',
  privacy_policy_url: 'https://bloomlog.io/privacy',
  privacy_start: 'Agree and get started',
  terms_title: 'Terms of Service',
  terms_url: '/terms',
  privacy_title: 'Privacy Policy',
};

const zh: TranslationKeys = {
  nav_home: '首页',
  nav_list: '列表',
  nav_packages: '疗程券',
  nav_calendar: '日历',
  nav_my: '我的',

  save: '保存',
  cancel: '取消',
  skip: '跳过',
  next: '下一步',
  close: '关闭',
  delete_confirm: '确定删除此治疗记录？',
  auto_saved: '✓ 已自动保存',
  logout: '退出登录',
  login: '登录',
  signup: '注册',

  auth_email: '邮箱',
  auth_password: '密码',
  auth_password_confirm: '确认密码',
  auth_login_title: '登录',
  auth_signup_title: '注册',
  auth_no_account: '还没有账号？',
  auth_has_account: '已有账号？',
  auth_google: '使用Google继续',
  auth_kakao: '使用Kakao继续',
  auth_or: '或',
  auth_forgot_password: '忘记密码？',
  reset_email_sent: '请检查您的邮箱',
  reset_email_title: '重置密码',
  reset_email_submit: '发送重置链接',
  auth_signup_success: '确认邮件已发送，请查收。',

  onboard_welcome: '欢迎！🎉',
  onboard_basic_info: '请填写基本信息',
  onboard_basic_desc: '告诉我们您的肤质和关注部位，为您提供个性化护理建议。',
  onboard_treatment: '记录您的治疗',
  onboard_treatment_desc: '记录最近的治疗以开始周期管理。',

  hello: '您好 👋',
  my_skin_care: '我的皮肤管理',
  treatment_needed: '需要治疗',
  upcoming_treatment: '即将治疗',
  maintaining: '维持中',
  held_points: '积分余额',
  urgent_treatments: '紧急治疗',
  skin_layer_status: '皮肤层管理状态',
  remaining_vouchers: '疗程券剩余',
  treatment_records: '治疗记录',
  view_all: '查看全部',
  fold: '收起',
  schedule_in_2weeks: '两周内预定',

  my_page: '个人中心',
  profile_tab: '资料',
  treatment_history_tab: '治疗记录',
  basic_info: '基本信息',
  skin_type: '肤质',
  birth_date: '出生日期',
  select_birth_date: '选择出生日期',
  age_prefix: '',
  age_suffix: '岁',
  active_regions: '主要活动区域',
  region_desc: '用于医院推荐 · 最多7个',
  dense_areas: '热门医院区域',
  sido: '省/市',
  gugun: '区/县',
  add_region: '添加区域',
  max_region: '最多可注册7个区域',
  care_areas: '管理部位',
  main_concerns: '主要关注',
  care_goals: '管理目标',
  total_records: '总治疗记录',
  avg_satisfaction: '平均满意度',
  satisfaction: '满意度',
  memo_placeholder: '记录治疗体验、效果、注意事项...',
  no_records: '暂无治疗记录',
  language_setting: '语言设置',

  epidermis: '表皮',
  dermis: '真皮',
  subcutaneous: '皮下',

  face: '面部',
  neck: '颈部',
  arm: '手臂',
  leg: '腿部',
  abdomen: '腹部',
  back: '背部',
  chest: '胸部',
  hip: '臀部',

  dry: '干性',
  oily: '油性',
  combination: '混合性',
  sensitive: '敏感性',
  normal: '中性',

  concern_pores: '毛孔',
  concern_pigment: '色素沉着',
  concern_elasticity: '弹性下降',
  concern_wrinkles: '皱纹',
  concern_acne: '痘痘',
  concern_redness: '泛红',
  concern_dryness: '干燥',
  concern_dark_circles: '黑眼圈',
  concern_hair_removal: '脱毛',
  concern_cellulite: '橘皮组织',
  concern_stretch_marks: '妊娠纹',

  goal_bright_skin: '透亮肤色',
  goal_pore_reduction: '缩小毛孔',
  goal_elasticity: '改善弹性',
  goal_wrinkle: '改善皱纹',
  goal_trouble: '缓解肌肤问题',
  goal_moisture: '加强保湿',
  goal_body_line: '身体塑形',
  goal_hair_removal: '完成脱毛',

  balance: '余额',
  cumulative_spent: '累计支出',

  treatment_list: '治疗列表',
  cycles_title: '周期管理',
  calendar_title: '日历',
  packages_title: '疗程券',
  status_title: '治疗状态',
  privacy_agree_policy: '[必须] 我同意隐私政策',
  privacy_agree_age: '[必须] 我已年满14周岁',
  privacy_view_full: '查看全文',
  privacy_policy_url: 'https://bloomlog.io/privacy',
  privacy_start: '同意并开始',
  terms_title: '使用条款',
  terms_url: '/terms',
  privacy_title: '隐私政策',
};

export const translations: Record<Language, TranslationKeys> = { ko, en, zh };
