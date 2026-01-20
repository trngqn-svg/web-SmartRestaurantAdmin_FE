import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { X, Menu, LogOut, ChevronRight } from 'lucide-react';
import { logoutApi } from '../api/admin/auth';
import { useNavigate } from 'react-router-dom';

const MENU_SECTIONS = [
  {
    title: 'Customer app',
    items: [
      { label: 'Login', to: '/customer/login' },
      { label: 'Register', to: '/customer/register' },
      { label: 'Menu', to: '/customer/menu' },
      { label: 'Cart', to: '/customer/cart' },
      { label: 'Orders', to: '/customer/orders' },
      { label: 'Profile', to: '/customer/profile' },
    ],
  },
  {
    title: 'Admin panel',
    items: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Orders', to: '/orders' },
      { label: 'Menu Items', to: '/menu/items' },
      { label: 'Categories', to: '/menu/categories' },
      { label: 'Tables', to: '/tables' },
      { label: 'Reports', to: '/reports' },
      { label: 'Accounts', to: '/accounts' },
      { label: 'Profile', to: '/profile' },
    ],
  },
  {
    title: 'Staff panel',
    items: [
      { label: 'Waiter', to: '/monitor/waiter' },
      { label: 'Kitchen Display', to: '/monitor/kds'}
    ]
  }
];

export default function TopRightDrawer() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    await logoutApi();
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  return (
    <>
      {/* Trigger Button - Main Brand Gold */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-4xl bg-[#1A2F2F] text-[#E2B13C] cursor-pointer px-5 py-2.5 shadow-lg hover:bg-[#1A2F2F] hover:text-white transition-all duration-300 group"
      >
        <Menu size={20} />
      </button>

      {/* Overlay Mask - Solid Dark Main Color (No Blur) */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-40 transition-opacity duration-50"
        />
      )}

      {/* Drawer Container - Zero Radius */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full sm:w-80 bg-white z-50
          transform transition-transform duration-500 ease-in-out
          flex flex-col rounded-none
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header Section - Dark Slate */}
        <div className="flex items-center justify-between p-6 bg-[#1A2F2F] border-b border-[#E2B13C]/20">
          <div className="flex flex-col">
            <h2 className="font-bold text-white text-lg leading-tight uppercase tracking-tight">All Mockups</h2>
            <span className="text-[10px] text-[#E2B13C] font-bold uppercase tracking-[0.2em]">Smart Restaurant</span>
          </div>
          <button
            className="cursor-pointer text-[#E2B13C] hover:text-white transition-colors"
            onClick={() => setOpen(false)}
          >
            <X size={28} />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto p-6">
          {MENU_SECTIONS.map((section, idx) => (
            <div key={section.title}>
              <p className="mb-4 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                {section.title}
              </p>

              <div className="flex flex-col">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center justify-between p-3.5 transition-all duration-200 font-bold uppercase text-xs tracking-wider rounded-none
                      ${isActive 
                        ? 'text-[#1A2F2F] bg-[#E2B13C] border-l-4 border-[#1A2F2F]' 
                        : 'text-[#1A2F2F] hover:bg-gray-100 border-l-4 border-transparent'}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span>{item.label}</span>
                        <ChevronRight 
                          size={14} 
                          className={`transition-opacity duration-200 ${
                            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`} 
                        />
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
              {idx < MENU_SECTIONS.length - 1 && <div className="mt-2 mb-4 border-b border-gray-300" />}
            </div>
          ))}
        </nav>

        {/* Logout Area - Solid Warning Style */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <button 
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="w-full flex items-center justify-center rounded-xl gap-3 p-4 rounded-none bg-white border-2 border-red-600 text-red-600 font-black hover:bg-red-600 hover:text-white transition-all duration-300 uppercase tracking-widest text-xs"
          >
            <LogOut size={18} />
            <span>Logout System</span>
          </button>
        </div>
      </div>
    </>
  );
}