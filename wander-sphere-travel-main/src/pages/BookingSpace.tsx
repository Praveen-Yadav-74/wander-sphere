import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const SERVICES = [
  {
    emoji: '✈️',
    title: 'Flights',
    subtitle: 'Search 500+ airlines',
    tagline: 'Cheapest fares guaranteed',
    gradient: 'from-[#E0F2FE] via-[#BAE6FD] to-[#E0F2FE]',
    borderColor: 'border-[#7DD3FC]',
    dotColor: 'bg-[#0EA5E9]',
    path: '/flights/search',
    badge: 'Most Popular',
    badgeColor: 'bg-[#0EA5E9] text-white',
  },
  {
    emoji: '🏨',
    title: 'Hotels',
    subtitle: '10,000+ hotels worldwide',
    tagline: 'Best prices, instant booking',
    gradient: 'from-[#F0FDF4] via-[#DCFCE7] to-[#F0FDF4]',
    borderColor: 'border-[#86EFAC]',
    dotColor: 'bg-[#22C55E]',
    path: null,
    badge: 'Coming Soon',
    badgeColor: 'bg-[#64748B] text-white',
  },
  {
    emoji: '🚌',
    title: 'Bus',
    subtitle: '1000+ routes across India',
    tagline: 'Comfortable & affordable',
    gradient: 'from-[#FFF7ED] via-[#FFEDD5] to-[#FFF7ED]',
    borderColor: 'border-[#FDBA74]',
    dotColor: 'bg-[#F97316]',
    path: null,
    badge: 'Coming Soon',
    badgeColor: 'bg-[#64748B] text-white',
  },
];

const BookingSpace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCardClick = (service: typeof SERVICES[0]) => {
    if (service.path) {
      navigate(service.path);
    } else {
      toast.info(`${service.title} booking is coming soon! ✨`);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div
      className="min-h-screen pb-24"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#F8FAFC' }}
    >
      {/* ── Hero Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0EA5E9] via-[#0284C7] to-[#0369A1] pt-12 pb-28 px-6 text-white">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <p className="text-white/70 text-sm font-semibold mb-1">{greeting}, {user?.firstName || 'Traveler'} 👋</p>
          <h1 className="text-[32px] sm:text-[42px] font-black leading-tight tracking-tight">
            Where are you<br />
            <span className="text-[#BAE6FD]">headed?</span>
          </h1>
          <p className="mt-3 text-white/60 font-medium text-sm sm:text-base">
            Book flights, hotels & buses — all in one place
          </p>
        </div>
      </div>

      {/* ── Service Cards ─────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SERVICES.map((svc) => (
            <button
              key={svc.title}
              onClick={() => handleCardClick(svc)}
              className={`
                group relative bg-gradient-to-br ${svc.gradient} 
                border ${svc.borderColor} 
                rounded-3xl 
                shadow-[0_4px_20px_rgba(0,0,0,0.08)] 
                hover:shadow-[0_12px_32px_rgba(0,0,0,0.14)] 
                hover:-translate-y-2 
                transition-all duration-300 
                text-left p-6 overflow-hidden
                active:scale-[0.98]
              `}
            >
              {/* Badge */}
              <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-4 ${svc.badgeColor}`}>
                {svc.badge}
              </span>

              {/* Floating emoji */}
              <div className="text-5xl mb-4 block group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300 origin-bottom-left">
                {svc.emoji}
              </div>

              {/* Text */}
              <h2 className="text-[#0F172A] font-black text-2xl leading-none mb-1.5">{svc.title}</h2>
              <p className="text-[#0F172A]/70 font-semibold text-sm">{svc.subtitle}</p>
              <p className="text-[#0F172A]/50 font-medium text-xs mt-1">{svc.tagline}</p>

              {/* Arrow */}
              <div className={`mt-5 w-9 h-9 rounded-2xl ${svc.dotColor} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </div>

              {/* Decorative circle background */}
              <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-black/5 pointer-events-none" />
            </button>
          ))}
        </div>

        {/* ── Why Choose Us ────────────────────────────────────── */}
        <div className="mt-8 bg-white rounded-3xl border border-[#E2E8F0] shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6">
          <h3 className="text-[#0F172A] font-bold text-base mb-5">Why book with us?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: '🔒', title: 'Secure Payments', sub: '256-bit SSL encryption' },
              { icon: '⚡', title: 'Instant Tickets', sub: 'Issued in seconds' },
              { icon: '💸', title: 'Best Prices', sub: 'Compare 500+ airlines' },
              { icon: '📞', title: '24/7 Support', sub: 'Always here to help' },
            ].map(({ icon, title, sub }) => (
              <div key={title} className="flex flex-col items-center text-center gap-2">
                <div className="w-11 h-11 bg-[#F0F9FF] rounded-2xl flex items-center justify-center text-xl border border-[#E0F2FE]">
                  {icon}
                </div>
                <p className="text-[#0F172A] font-semibold text-xs">{title}</p>
                <p className="text-[#94A3B8] text-[10px] font-medium">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSpace;
