import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingCart, ClipboardList, User2 } from "lucide-react";

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

type NavItem = {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: number;
  isButton?: boolean;
};

function BottomNavMobileStyled(props: {
  cartCount: number;
}) {
  const { cartCount } = props;
  const loc = useLocation();

  const navItems: NavItem[] = [
    { path: "/customer/menu", label: "Menu", icon: Home },
    { path: "/customer/cart", label: "Cart", icon: ShoppingCart, badge: cartCount },
    { path: "/customer/orders", label: "Orders", icon: ClipboardList },
    { path: "/customer/profile", label: "Profile", icon: User2, isButton: true },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-safe">
      <nav className="mx-auto w-full max-w-[400px] bg-[#0F172A]">
        <div className="mx-auto flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = loc.pathname === item.path;
            const Icon = item.icon;

            const cls = cn(
              "flex flex-col items-center justify-center transition-all duration-300 relative px-4 py-1",
              isActive ? "text-[#E2B13C]" : "text-slate-500"
            );

            const content = (
              <>
                <div className="relative">
                  <Icon
                    className={cn("w-5 h-5", isActive && "scale-110")}
                    strokeWidth={isActive ? 2.5 : 2}
                  />

                  {!!item.badge && item.badge > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E2B13C] px-1 text-[10px] font-black text-[#0F172A] ring-2 ring-[#0F172A]">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={cn(
                    "text-[10px] mt-1.5 font-bold tracking-widest uppercase",
                    isActive ? "opacity-100" : "opacity-50"
                  )}
                >
                  {item.label}
                </span>

                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-[#E2B13C] rounded-full shadow-[0_0_8px_#E2B13C]" />
                )}
              </>
            );

            return (
              <Link key={item.path} to={`${item.path}`} className={cls} aria-label={item.label}>
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default BottomNavMobileStyled;
