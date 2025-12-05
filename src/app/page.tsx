import Link from 'next/link';
import { Gift, Sparkles, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Gift className="w-16 h-16 text-yellow-400" />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            <span className="text-yellow-400">Lucky</span> Spin
          </h1>

          <p className="text-xl text-white/70 mb-8">
            Vòng quay may mắn - Quay ngay nhận quà liền tay!
          </p>

          {/* CTA Button */}
          <Link
            href="/spin"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition"
          >
            <Sparkles className="w-6 h-6" />
            Tham gia quay thưởng
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
}
