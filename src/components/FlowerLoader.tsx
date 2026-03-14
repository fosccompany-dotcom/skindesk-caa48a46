import logoImg from '@/assets/logo.png';

export default function FlowerLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <img
        src={logoImg}
        alt="Loading"
        className="w-16 h-16 animate-spin-slow opacity-70"
      />
    </div>
  );
}
