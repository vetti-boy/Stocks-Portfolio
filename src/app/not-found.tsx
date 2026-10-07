import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080B10] text-[#F4F7FA] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="h-12 w-12 rounded-2xl bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center font-bold text-[#38BDF8] text-lg font-mono">
        404
      </div>
      <h2 className="text-xl font-extrabold text-white tracking-tight">Page Not Found</h2>
      <p className="text-xs text-[#8D99A8] max-w-sm">
        The requested terminal route does not exist or has been relocated.
      </p>
      <Link
        href="/"
        className="pill-btn-primary text-xs font-bold px-5 py-2.5 inline-block"
      >
        Return to Terminal Dashboard &rarr;
      </Link>
    </div>
  );
}
