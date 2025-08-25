import { useLocation, Link } from "react-router-dom";
import { Home, Users, MapPin, Map, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/clubs", icon: Users, label: "Clubs" },
    { href: "/find-trips", icon: MapPin, label: "Find Trips" },
    { href: "/map", icon: Map, label: "Map" },
    { href: "/budget", icon: Wallet, label: "Budget" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md shadow-lg">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = location.pathname === href;
          
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 min-w-0 flex-1 max-w-20",
                isActive 
                  ? "text-primary bg-primary/15 shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              )}
            >
              <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", isActive && "scale-110")} />
              <span className="text-xs font-medium truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;