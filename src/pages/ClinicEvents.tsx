/**
 * @deprecated /treatments/events 경로는 /treatments 와 동일한 이벤트 페이지로 통합됨.
 * 이 컴포넌트는 호환성을 위해 Treatments를 그대로 렌더링.
 */

import Treatments from './Treatments';

export default function ClinicEvents() {
  return <Treatments />;
}
