'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/auth/check');
        const data = await res.json();
        console.log('Auth check result:', data);
        setIsAuthenticated(data.authenticated);
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated === false && pathname !== '/admin/login') {
      router.replace('/admin/login');
    }
  }, [isAuthenticated, pathname, router]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  // Sidebar navigation items
  const navItems = [
    { path: '/admin', name: 'Dashboard', icon: '📊' },
    { path: '/admin/vouchers', name: 'Vouchers', icon: '🎫' },
    { path: '/admin/users', name: 'Users', icon: '👥' },
    { path: '/admin/winners', name: 'Winners', icon: '🏆' },
    { path: '/admin/analytics', name: 'Analytics', icon: '📈' },
    { path: '/admin/scratch-events', name: 'Scratch Events', icon: '🎰' },
    { path: '/admin/accounts', name: 'Admin Accounts', icon: '🔑' },
    { path: '/admin/settings', name: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-3 shadow-lg">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-700 transition"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          Admin Panel
        </h1>
        <div className="w-6" />
      </header>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 max-w-[80vw] bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl z-40 flex flex-col transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-700 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <p className="text-xs text-gray-400 mt-1">Voucher Platform Manager</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white text-xl leading-none"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                pathname === item.path
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={async () => {
              await fetch('/api/admin/auth/logout', { method: 'POST' });
              router.push('/admin/login');
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 w-full transition"
          >
            <span className="text-xl">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}