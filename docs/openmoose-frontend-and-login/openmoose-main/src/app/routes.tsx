import { createBrowserRouter } from 'react-router';
import { Home } from './pages/Home';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Billing } from './pages/Billing';
import { UseCases } from './pages/UseCases';
import { Docs } from './pages/Docs';
import { Subscribe } from './pages/Subscribe';
import { VerifyEmail } from './pages/VerifyEmail';
import { AuthCallback } from './pages/AuthCallback';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      {children}
      <Footer />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Layout>
        <Home />
      </Layout>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <Layout>
        <Dashboard />
      </Layout>
    ),
  },
  {
    path: '/settings',
    element: (
      <Layout>
        <Settings />
      </Layout>
    ),
  },
  {
    path: '/billing',
    element: (
      <Layout>
        <Billing />
      </Layout>
    ),
  },
  {
    path: '/use-cases',
    element: (
      <Layout>
        <UseCases />
      </Layout>
    ),
  },
  {
    path: '/docs',
    element: (
      <Layout>
        <Docs />
      </Layout>
    ),
  },
  {
    path: '/subscribe',
    element: (
      <Layout>
        <Subscribe />
      </Layout>
    ),
  },
  {
    path: '/signin',
    element: <SignIn />,
  },
  {
    path: '/signup',
    element: <SignUp />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmail />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />,
  },
]);