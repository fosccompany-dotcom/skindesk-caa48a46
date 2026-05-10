import logoImg from '@/assets/logo_transparent.png';

export default function FlowerLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[hsl(350,15%,96%)]">
      <img
        src={logoImg}
        alt="Bloomlog"
        className="w-60 h-60 opacity-90"
      />
    </div>
  );
}
