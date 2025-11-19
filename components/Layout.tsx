import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Library, 
  Settings, 
  LogOut, 
  Mic2, 
  Menu,
  X
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/new-episode', icon: <PlusCircle size={20} />, label: 'Novo Episódio' },
    { path: '/library', icon: <Library size={20} />, label: 'Biblioteca' }, // Placeholder for future
    { path: '/settings', icon: <Settings size={20} />, label: 'Configurações' }, // Placeholder for future
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 flex flex-col
      `}>
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-indigo-600">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Mic2 className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">Churchify</span>
          </div>
          <button 
            className="md:hidden ml-auto text-gray-500"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-6 px-2">
             <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Igreja</p>
             <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
               <p className="font-bold text-indigo-900 text-sm">Igreja Batista</p>
               <p className="text-xs text-indigo-600">Plano Free</p>
             </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive(item.path) 
                    ? 'bg-gray-900 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <img 
              src={user?.photoURL || "https://ui-avatars.com/api/?name=User"} 
              alt="User" 
              className="w-8 h-8 rounded-full border border-gray-200"
            />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.displayName || "Usuário"}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
           <div className="flex items-center gap-2 text-indigo-600">
              <Mic2 className="w-6 h-6" />
              <span className="font-bold text-gray-900">Churchify</span>
           </div>
           <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-600">
             <Menu size={24} />
           </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};