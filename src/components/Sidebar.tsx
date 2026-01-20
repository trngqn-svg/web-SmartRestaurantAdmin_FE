import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Utensils, 
  Layers, 
  Grid2X2, 
  UtensilsCrossed,
  User,
  ChartColumn,
  ReceiptText,
  UserPen
} from 'lucide-react';

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-4 px-6 py-4 text-sm font-medium transition-all duration-200 group
        ${isActive 
          ? 'bg-[#E2B13C]/10 text-[#E2B13C] border-l-4 border-[#E2B13C]' 
          : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent'
        }`
      }
    >
      <span className="transition-transform group-hover:scale-110">
        {icon}
      </span>
      {label}
    </NavLink>
  );
};

export default function Sidebar() {
  const username = localStorage.getItem('username') || 'admin';

  return (
    <aside className="hidden md:flex w-64 bg-slate-900 flex-col h-screen sticky top-0 border-r border-white/5 shadow-xl">
      
      {/* Top Section: Integrated Logo & Branding */}
      <div className="h-24 flex flex-col justify-center px-6 border-b border-white/10 bg-slate-900">
        <div className="flex items-end gap-1 leading-none">
          {/* Stylized Logo Icon from Image */}
          <div className="relative flex items-center justify-center">
             <UtensilsCrossed size={32} color="#E2B13C"/>
          </div>
          <div className="flex flex-col ml-2">
            <span className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase leading-none mb-1">
              Smart
            </span>
            <span className="text-sm font-bold text-[#E2B13C] uppercase leading-none">
              Restaurant
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 mt-6">
        <SidebarLink to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
        <SidebarLink to="/orders" icon={<ReceiptText size={20} />} label="Orders" />
        <SidebarLink to="/menu/items" icon={<Utensils size={20} />} label="Menu Items" />
        <SidebarLink to="/menu/categories" icon={<Layers size={20} />} label="Categories" />
        <SidebarLink to="/tables" icon={<Grid2X2 size={20} />} label="Tables" />
        <SidebarLink to="/reports" icon={<ChartColumn size={20} />} label="Reports" />
        <SidebarLink to="/accounts" icon={<User size={20} />} label="Accounts" />
        <SidebarLink to="/profile" icon={<UserPen size={20} />} label="Profile" />
      </nav>

      {/* Bottom Section: User Profile */}
      <div className="border-t border-white/10 bg-[#162828]">
        <div className="p-6 flex items-center gap-3">
          {/* Square Avatar (Zero Radius) */}
          <div className="w-10 h-10 bg-[#E2B13C] text-[#1A2F2F] flex items-center justify-center font-bold text-lg border border-[#E2B13C]/20 shrink-0">
            {username[0].toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm text-white font-semibold truncate leading-tight">{username}</p>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-tighter mt-1">
              Admin Restaurant
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}