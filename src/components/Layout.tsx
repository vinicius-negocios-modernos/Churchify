import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChurch } from '@/contexts/ChurchContext';
import { ChurchSwitcher } from '@/components/ChurchSwitcher';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  LayoutDashboard,
  PlusCircle,
  Library,
  Settings,
  LogOut,
  Mic2,
  Menu,
} from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentRole } = useChurch();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/new-episode', icon: <PlusCircle size={20} />, label: 'Novo Episódio' },
    { path: '/library', icon: <Library size={20} />, label: 'Biblioteca' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Configurações' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const sidebarContent = (
    <>
      <div className="p-4">
        <div className="mb-6 px-2">
           <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Igreja</p>
           <ChurchSwitcher />
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
            src={user?.user_metadata?.avatar_url || "https://ui-avatars.com/api/?name=User"}
            alt="User"
            className="w-8 h-8 rounded-full border border-gray-200"
          />
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.user_metadata?.full_name || "Usuário"}</p>
              {currentRole && (
                <span className="shrink-0 inline-flex items-center rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                  {ROLE_LABELS[currentRole] ?? currentRole}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Sair
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sair da conta</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja sair?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={logout}>Sair</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Skip to main content — a11y */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-black"
      >
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-indigo-600">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Mic2 className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">Churchify</span>
          </div>
        </div>
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
           <div className="flex items-center gap-2 text-indigo-600">
              <Mic2 className="w-6 h-6" />
              <span className="font-bold text-gray-900">Churchify</span>
           </div>

           {/* Mobile Sidebar via Sheet */}
           <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
             <SheetTrigger asChild>
               <button className="text-gray-600" aria-label="Abrir menu">
                 <Menu size={24} />
               </button>
             </SheetTrigger>
             <SheetContent side="left" className="w-64 p-0 flex flex-col">
               <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
               <div className="h-16 flex items-center px-6 border-b border-gray-100">
                 <div className="flex items-center gap-2 text-indigo-600">
                   <div className="bg-indigo-600 p-1.5 rounded-lg">
                     <Mic2 className="text-white w-5 h-5" />
                   </div>
                   <span className="text-lg font-bold tracking-tight text-gray-900">Churchify</span>
                 </div>
               </div>
               {sidebarContent}
             </SheetContent>
           </Sheet>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-[1280px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
