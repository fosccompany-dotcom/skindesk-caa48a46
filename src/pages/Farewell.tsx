import { useEffect, useState } from 'react';
import logoImg from '@/assets/logo_transparent.png';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface Petal {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
}

const PETAL_COUNT = 24;

function generatePetals(): Petal[] {
  return Array.from({ length: PETAL_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 4,
    size: 20 + Math.random() * 28,
    opacity: 0.5 + Math.random() * 0.5,
  }));
}

export default function Farewell() {
  const navigate = useNavigate();
  const [petals] = useState(generatePetals);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowText(true), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Falling flower petals */}
      {petals.map((p) => (
        <img
          key={p.id}
          src={logoImg}
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            left: `${p.left}%`,
            top: '-60px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animation: `petal-fall ${p.duration}s ease-in ${p.delay}s infinite`,
          }}
        />
      ))}

      {/* Farewell message */}
      <div
        className={`relative z-10 flex flex-col items-center gap-6 px-8 text-center transition-all duration-1000 ${
          showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <img
          src={logoImg}
          alt="Bloom"
          className="w-20 h-20 animate-spin-slow opacity-80"
        />
        <div className="space-y-3">
          <p className="text-xl font-semibold text-foreground">
            당신의 씨앗을 잘 품고 있을게요
          </p>
          <p className="text-lg text-muted-foreground">
            언제든지 돌아와요
          </p>
          <p className="text-lg font-medium text-primary">
            기다릴게요 !
          </p>
        </div>

        <Button
          variant="outline"
          className="mt-8"
          onClick={() => navigate('/signup')}
        >
          돌아가기
        </Button>
      </div>

      {/* Keyframe for petal fall */}
      <style>{`
        @keyframes petal-fall {
          0% {
            transform: translateY(0) rotate(0deg) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(calc(100vh + 80px)) rotate(360deg) translateX(30px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
