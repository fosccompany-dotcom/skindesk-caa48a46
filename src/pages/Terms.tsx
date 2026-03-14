import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const termsContent = {
  ko: {
    title: '이용약관',
    effective: '시행일: 2026년 3월 14일',
    sections: [
      {
        heading: '제1조 (목적)',
        body: `본 약관은 FOSC Company(이하 "회사")가 제공하는 Bloomlog 서비스(이하 "서비스")의 이용 조건 및 절차, 회사와 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.`,
      },
      {
        heading: '제2조 (서비스의 성격)',
        body: `본 서비스는 개인 피부 시술 기록 관리를 위한 도구입니다. 의료 서비스, 의료 상담, 또는 의료 행위를 제공하지 않습니다. 서비스 내 모든 정보는 개인 기록 목적으로만 활용되어야 합니다.`,
      },
      {
        heading: '제3조 (베타 서비스)',
        body: `현재 서비스는 베타 테스트 단계로 운영됩니다. 회사는 사전 공지 없이 서비스의 일부 또는 전부를 변경하거나 중단할 수 있습니다. 베타 기간 중 발생하는 데이터 손실에 대해 회사는 책임을 지지 않습니다.`,
      },
      {
        heading: '제4조 (이용자의 의무)',
        body: `이용자는 타인의 개인정보를 무단으로 수집·이용하여서는 안 됩니다.
서비스를 상업적 목적으로 무단 이용하여서는 안 됩니다.
서비스의 정상적인 운영을 방해하는 행위를 하여서는 안 됩니다.`,
      },
      {
        heading: '제5조 (책임의 한계)',
        body: `회사는 서비스 이용으로 발생한 손해에 대해 고의 또는 중과실이 없는 한 책임을 지지 않습니다.
회사는 이용자가 서비스에 입력한 정보의 정확성에 대해 보증하지 않습니다.`,
      },
      {
        heading: '제6조 (준거법 및 관할)',
        body: `본 약관은 대한민국 법률에 따라 해석되며, 분쟁 발생 시 서울중앙지방법원을 전속 관할 법원으로 합니다.

문의: fosccompany@gmail.com`,
      },
    ],
  },
  en: {
    title: 'Terms of Service',
    effective: 'Effective Date: March 14, 2026',
    sections: [
      {
        heading: 'Article 1 (Purpose)',
        body: `These Terms govern the use of the Bloomlog service ("Service") provided by FOSC Company ("Company"), including conditions, procedures, and the rights and responsibilities of users.`,
      },
      {
        heading: 'Article 2 (Nature of Service)',
        body: `The Service is a personal skincare treatment record management tool. It does not provide medical services, medical advice, or medical treatment. All information within the Service is for personal record-keeping purposes only.`,
      },
      {
        heading: 'Article 3 (Beta Service)',
        body: `The Service is currently in beta. The Company may change or discontinue part or all of the Service without prior notice. The Company is not responsible for data loss during the beta period.`,
      },
      {
        heading: 'Article 4 (User Obligations)',
        body: `Users must not collect or use others' personal information without authorization.
Users must not use the Service for unauthorized commercial purposes.
Users must not interfere with the normal operation of the Service.`,
      },
      {
        heading: 'Article 5 (Limitation of Liability)',
        body: `The Company is not liable for damages arising from use of the Service unless caused by intentional or gross negligence.
The Company does not guarantee the accuracy of information entered by users.`,
      },
      {
        heading: 'Article 6 (Governing Law)',
        body: `These Terms are governed by the laws of the Republic of Korea. Any disputes shall be subject to the exclusive jurisdiction of the Seoul Central District Court.

Contact: fosccompany@gmail.com`,
      },
    ],
  },
  zh: {
    title: '使用条款',
    effective: '生效日期：2026年3月14日',
    sections: [
      {
        heading: '第一条（目的）',
        body: `本条款旨在规定FOSC Company（以下简称"公司"）提供的Bloomlog服务（以下简称"服务"）的使用条件及程序，以及公司与用户之间的权利义务和责任。`,
      },
      {
        heading: '第二条（服务性质）',
        body: `本服务是个人美容记录管理工具，不提供医疗服务、医疗咨询或医疗行为。服务内的所有信息仅用于个人记录目的。`,
      },
      {
        heading: '第三条（测试版服务）',
        body: `本服务目前处于测试阶段。公司可在不事先通知的情况下变更或中止部分或全部服务。对于测试期间发生的数据丢失，公司概不负责。`,
      },
      {
        heading: '第四条（用户义务）',
        body: `用户不得擅自收集或使用他人个人信息。
用户不得将服务用于未经授权的商业目的。
用户不得干扰服务的正常运营。`,
      },
      {
        heading: '第五条（责任限制）',
        body: `除故意或重大过失外，公司对因使用服务造成的损失不承担责任。
公司不保证用户输入信息的准确性。`,
      },
      {
        heading: '第六条（适用法律）',
        body: `本条款依照大韩民国法律解释，发生纠纷时以首尔中央地方法院为专属管辖法院。

联系方式：fosccompany@gmail.com`,
      },
    ],
  },
};

const Terms = () => {
  const { language } = useLanguage();
  const content = termsContent[language];

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

export default Terms;