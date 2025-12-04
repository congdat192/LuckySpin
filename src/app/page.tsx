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

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/spin"
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition"
            >
              <Sparkles className="w-6 h-6" />
              Tham gia quay thưởng
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>

            <Link
              href="/admin"
              className="px-6 py-3 text-white/80 hover:text-white border border-white/30 hover:border-white/50 rounded-full transition"
            >
              Admin Panel
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <FeatureCard
              icon="🎯"
              title="Đa sự kiện"
              description="Hỗ trợ nhiều chương trình khuyến mãi khác nhau"
            />
            <FeatureCard
              icon="🏪"
              title="9 Chi nhánh"
              description="Quản lý tồn kho và tỉ lệ riêng từng chi nhánh"
            />
            <FeatureCard
              icon="📊"
              title="Báo cáo chi tiết"
              description="Thống kê và xuất báo cáo dễ dàng"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/60 text-sm">{description}</p>
    </div>
  );
}
