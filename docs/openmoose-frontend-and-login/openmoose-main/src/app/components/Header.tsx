import { Menu } from 'lucide-react';
import { Button } from './ui/button';
import { UserMenu } from './UserMenu';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router';

export function Header() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleFeaturesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      // Already on home page, just scroll
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Navigate to home page with hash
      navigate('/#features');
      // After navigation, scroll to features
      setTimeout(() => {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handlePricingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/#pricing');
      setTimeout(() => {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-full shadow-sm">
        <div className="flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-600 to-slate-800 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm">
              M
            </div>
            <span className="font-bold text-xl text-gray-900">
              openmoose
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="/#features" className="text-sm text-gray-600 hover:text-slate-700 transition-colors font-medium" onClick={handleFeaturesClick}>Features</a>
            <a href="/#pricing" className="text-sm text-gray-600 hover:text-slate-700 transition-colors font-medium" onClick={handlePricingClick}>Pricing</a>
            <a href="#docs" className="text-sm text-gray-600 hover:text-slate-700 transition-colors font-medium">Docs</a>
            <a href="#blog" className="text-sm text-gray-600 hover:text-slate-700 transition-colors font-medium">Blog</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button 
                  size="sm" 
                  className="hidden md:inline-flex bg-slate-700 hover:bg-slate-800 text-white rounded-full px-6 font-medium"
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </Button>
                <UserMenu />
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hidden md:inline-flex hover:bg-gray-100 text-gray-700"
                  onClick={() => navigate('/signin')}
                >
                  Sign in
                </Button>
                <Button 
                  size="sm" 
                  className="bg-slate-700 hover:bg-slate-800 text-white rounded-full px-6"
                  onClick={() => navigate('/signup')}
                >
                  Get started
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}