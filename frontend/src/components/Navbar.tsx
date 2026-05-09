import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut, LayoutDashboard, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`fixed left-0 right-0 top-0 z-50 flex justify-center px-4 transition-all duration-500 ${isScrolled ? 'pt-4' : 'pt-4'}`}>
      <div className={`w-full rounded-full border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-all duration-500 px-4 sm:px-6 ${isScrolled ? 'bg-black/80 max-w-3xl' : 'bg-black/45 max-w-5xl'}`}>
        <div className={`flex items-center justify-between transition-all duration-500 ${isScrolled ? 'h-12' : 'h-14'}`}>
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-200/20 bg-gradient-to-br from-orange-300 to-orange-600 shadow-lg shadow-orange-500/25 transition-shadow group-hover:shadow-orange-500/40">
              <Shield className="h-4 w-4 text-black" />
            </div>
            <span className="text-base font-semibold tracking-normal text-white">
              Truth<span className="text-orange-300">Lens</span>
              <span className="ml-1 text-xs font-normal text-zinc-500">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <a
              href="/#pipeline"
              className="hidden text-sm text-zinc-500 transition-colors hover:text-zinc-100 sm:inline"
            >
              Pipeline
            </a>
            <a
              href="/#analyze"
              className="hidden text-sm text-zinc-500 transition-colors hover:text-zinc-100 sm:inline"
            >
              Analyze
            </a>
            <Link
              to="/news"
              className="hidden text-sm text-zinc-500 transition-colors hover:text-zinc-100 sm:inline"
            >
              Live News
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-white/10">
                    <User className="h-3.5 w-3.5 text-orange-300" />
                  </div>
                  <span className="hidden sm:inline">{user?.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-red-300"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm text-zinc-500 transition-colors hover:text-white"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-black shadow-lg shadow-orange-500/20 transition hover:bg-orange-400"
                >
                  Sign Up
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
