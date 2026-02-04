import { useLocation, Link } from "react-router-dom";
import { Home, Compass, Ticket, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { 
      href: "/", 
      icon: Home, 
      label: "Home"
    },
    { 
      href: "/find-trips", 
      icon: Compass, 
      label: "Trips"
    },
    { 
      href: "/booking", 
      icon: Ticket, 
      label: "Bookings"
    },
    { 
      href: "/wallet", 
      icon: Wallet, 
      label: "Wallet"
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = location.pathname === href;
          
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                "relative flex flex-col items-center justify-center py-3 px-4 min-w-[4rem] transition-colors",
                isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {/* Active Indicator Line */}
              {isActive && (
                <motion.div
                  layoutId="active-tab-indicator"
                  className="absolute top-0 w-8 h-0.5 bg-primary rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              <div className="relative">
                <Icon 
                    className={cn(
                        "w-6 h-6 mb-1 transition-transform duration-300", 
                        isActive && "scale-110" 
                    )} 
                    strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              
              <span className={cn(
                  "text-[10px] font-medium tracking-wide transition-all",
                  isActive ? "text-primary" : "text-gray-400"
              )}>
                  {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;