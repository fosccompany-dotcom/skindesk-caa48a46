import logoImg from '@/assets/logo_transparent.png';

export default function FlowerLoader() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <img
        src={logoImg}
        alt="Loading"
        className="w-28 h-28 animate-spin-slow opacity-70"
      />
    </div>
  );
}
