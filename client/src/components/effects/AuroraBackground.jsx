export default function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950" />

      {/* Aurora blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-[120px] animate-aurora" />
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-violet-400/15 dark:bg-violet-500/10 rounded-full blur-[100px] animate-aurora" style={{ animationDelay: '-3s' }} />
      <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] bg-cyan-400/10 dark:bg-cyan-500/10 rounded-full blur-[100px] animate-aurora" style={{ animationDelay: '-5s' }} />
    </div>
  );
}
