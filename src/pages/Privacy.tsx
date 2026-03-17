import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const privacyContent = {
  ko: {
    title: '개인정보처리방침',
    effective: '시행일: 2026년 3월 14일',
    sections: [
      {
        heading: '1. 수집하는 개인정보 항목',
        body: `필수: 이메일 주소, 서비스 이용 기록
선택(직접 입력): 이름/닉네임, 생년월일, 피부 타입, 시술 기록(시술명·날짜·병원명·금액·메모), 시술권 잔액 및 결제 내역
※ 시술 기록은 건강에 관한 민감정보입니다. 입력 여부는 사용자가 결정하며 서비스 제공 외 목적으로 사용되지 않습니다.`,
      },
      {
        heading: '2. 수집 목적',
        body: `이메일: 로그인 인증, 계정 관리
시술 기록: 개인 시술 이력 조회 및 관리 기능 제공
결제/잔액: 병원별 포인트 잔액 및 패키지 현황 표시
이용 기록: 서비스 개선, 오류 대응
Bloomlog는 의료 서비스가 아니며 수집 정보를 의료 목적으로 활용하거나 제3자 의료기관에 제공하지 않습니다.`,
      },
      {
        heading: '3. 보유 및 이용 기간',
        body: `회원 탈퇴 시 또는 수집 목적 달성 시 즉시 삭제.
전자상거래법에 따라 소비자 불만/분쟁 기록은 3년 보관.`,
      },
      {
        heading: '4. 제3자 제공',
        body: '사용자 동의 또는 법령에 의한 경우 외 제공하지 않습니다.',
      },
      {
        heading: '5. 처리 위탁',
        body: `Supabase Inc. — 데이터베이스 저장 및 인증 (회원 탈퇴 시까지)
Anthropic Inc. — 영수증 AI 파싱 선택 기능 (처리 후 즉시 삭제)`,
      },
      {
        heading: '6. 사용자 권리',
        body: `열람·수정·삭제·처리정지 요청 가능.
삭제 요청: 마이페이지 → 탈퇴 또는 fosccompany@gmail.com (5영업일 이내 처리)`,
      },
      {
        heading: '7. 개인정보 보호 조치',
        body: 'SSL/TLS 암호화, 사용자별 데이터 격리(RLS), 비밀번호 암호화 저장.',
      },
      {
        heading: '8. 만 14세 미만 아동',
        body: '만 14세 미만 가입 불가.',
      },
      {
        heading: '9. 개인정보 보호책임자',
        body: 'FOSC Company / fosccompany@gmail.com / 문의 접수 후 5영업일 이내',
      },
      {
        heading: '10. 방침 변경',
        body: '변경 시 앱 내 공지 또는 이메일로 7일 전 고지.',
      },
      {
        heading: '11. 회원 탈퇴 및 개인정보 처리',
        body: `회원이 탈퇴를 요청할 경우 다음과 같이 처리됩니다.

즉시 처리: 이름, 이메일, 생년월일 등 개인식별정보는 즉시 삭제 또는 익명화 처리됩니다.

30일 유예: 탈퇴 요청일로부터 30일간 계정 복구가 가능하며, 30일 경과 후 모든 데이터가 완전 삭제됩니다.

결제 기록 보관: 전자상거래 등에서의 소비자 보호에 관한 법률에 따라 결제 관련 기록은 5년간 보관됩니다.

익명화 데이터: 개인을 식별할 수 없는 형태로 익명화된 통계 데이터는 서비스 개선 목적으로 보관될 수 있습니다.`,
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    effective: 'Effective Date: March 14, 2026',
    sections: [
      {
        heading: '1. Information We Collect',
        body: `Required: Email address, service usage logs
Optional (user-entered): Name/nickname, date of birth, skin type, treatment records (name, date, clinic, amount, notes), point balances and payment history
※ Treatment records are sensitive health information. You decide what to enter; data is used solely to provide the service.`,
      },
      {
        heading: '2. Purpose of Collection',
        body: `Email: Login authentication and account management
Treatment records: Personal treatment history and management features
Payment/balance: Clinic-specific point balance and package tracking
Usage logs: Service improvement and error response
Bloomlog is not a medical service and does not use collected data for medical purposes or share it with healthcare providers.`,
      },
      {
        heading: '3. Retention Period',
        body: `Deleted immediately upon account withdrawal or when the collection purpose is fulfilled.
Consumer dispute records retained for 3 years under e-commerce law.`,
      },
      {
        heading: '4. Third-Party Sharing',
        body: 'Not shared except with user consent or as required by law.',
      },
      {
        heading: '5. Data Processing Delegation',
        body: `Supabase Inc. — Database storage and authentication (until account withdrawal)
Anthropic Inc. — Optional AI receipt parsing (deleted immediately after processing)`,
      },
      {
        heading: '6. User Rights',
        body: `You may request access, correction, deletion, or suspension of processing at any time.
Deletion requests: My Page → Withdraw, or email fosccompany@gmail.com (processed within 5 business days)`,
      },
      {
        heading: '7. Security Measures',
        body: 'SSL/TLS encryption, per-user data isolation (RLS), encrypted password storage.',
      },
      {
        heading: '8. Children Under 14',
        body: 'Users under 14 years of age are not permitted to register.',
      },
      {
        heading: '9. Privacy Officer',
        body: 'FOSC Company / fosccompany@gmail.com / Responded within 5 business days',
      },
      {
        heading: '10. Policy Updates',
        body: 'Changes will be notified via in-app notice or email at least 7 days in advance.',
      },
      {
        heading: '11. Account Withdrawal & Data Processing',
        body: `When a user requests account withdrawal, the following procedures apply.

Immediate processing: Personal identifiable information such as name, email, and date of birth is immediately deleted or anonymized.

30-day grace period: Account recovery is available for 30 days from the withdrawal request date. After 30 days, all data is permanently deleted.

Payment record retention: Payment-related records are retained for 5 years in accordance with the Act on Consumer Protection in Electronic Commerce.

Anonymized data: Statistical data anonymized in a form that cannot identify individuals may be retained for service improvement purposes.`,
      },
    ],
  },
  zh: {
    title: '隐私政策',
    effective: '生效日期：2026年3月14日',
    sections: [
      {
        heading: '1. 收集的个人信息',
        body: `必填：电子邮件地址、服务使用记录
选填（用户自行输入）：姓名/昵称、出生日期、肤质、美容记录（项目名称、日期、诊所、费用、备注）、积分余额及支付记录
※ 美容记录属于健康敏感信息。是否填写由用户自行决定，仅用于提供服务，不作其他用途。`,
      },
      {
        heading: '2. 收集目的',
        body: `电子邮件：登录认证及账户管理
美容记录：个人美容历史查询及管理功能
支付/余额：各诊所积分余额及套餐状态展示
使用记录：服务改进及错误处理
Bloomlog 不是医疗服务，不将收集的信息用于医疗目的，也不向第三方医疗机构提供。`,
      },
      {
        heading: '3. 保留期限',
        body: `账户注销或收集目的达成后立即删除。
依电子商务法，消费者投诉/纠纷记录保留3年。`,
      },
      {
        heading: '4. 第三方提供',
        body: '除用户同意或法律要求外，不向第三方提供。',
      },
      {
        heading: '5. 数据处理委托',
        body: `Supabase Inc. — 数据库存储及认证（至账户注销为止）
Anthropic Inc. — 可选AI收据解析功能（处理后立即删除）`,
      },
      {
        heading: '6. 用户权利',
        body: `可随时申请查阅、更正、删除或停止处理。
删除申请：我的页面 → 注销，或发送邮件至 fosccompany@gmail.com（5个工作日内处理）`,
      },
      {
        heading: '7. 安全措施',
        body: 'SSL/TLS加密、用户数据隔离（RLS）、密码加密存储。',
      },
      {
        heading: '8. 未满14周岁儿童',
        body: '不允许未满14周岁的用户注册。',
      },
      {
        heading: '9. 个人信息保护负责人',
        body: 'FOSC Company / fosccompany@gmail.com / 收到咨询后5个工作日内回复',
      },
      {
        heading: '10. 政策变更',
        body: '变更时将通过应用内通知或电子邮件提前7天告知。',
      },
      {
        heading: '11. 账户注销及个人信息处理',
        body: `会员申请注销时，将按以下方式处理。

即时处理：姓名、电子邮件、出生日期等个人身份信息将立即删除或匿名化处理。

30天缓冲期：自注销申请之日起30天内可恢复账户，30天后所有数据将被彻底删除。

支付记录保留：根据《电子商务中消费者保护法》，支付相关记录将保留5年。

匿名化数据：以无法识别个人身份的形式匿名化的统计数据可能会为改进服务而保留。`,
      },
    ],
  },
};

const Privacy = () => {
  const { language } = useLanguage();
  const content = privacyContent[language];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-base font-bold">{content.title}</h1>
      </div>

      <div className="max-w-[600px] mx-auto px-5 py-6 space-y-6">
        <p className="text-xs text-muted-foreground">{content.effective}</p>

        {content.sections.map((section, i) => (
          <div key={i} className="space-y-1.5">
            <h2 className="text-sm font-semibold text-foreground">{section.heading}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Privacy;
