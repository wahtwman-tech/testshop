import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/layout';
import { CustomerAuthProvider } from '@/lib/customer-auth';

import Home from '@/pages/home';
import SheepDetails from '@/pages/sheep-details';
import Orders from '@/pages/orders';
import Login from '@/pages/login';
import Register from '@/pages/register';
import VerifyEmail from '@/pages/verify-email';
import Profile from '@/pages/profile';
import PaymentSuccess from '@/pages/payment-success';
import PaymentFailure from '@/pages/payment-failure';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sheep/:id" component={SheepDetails} />
      <Route path="/orders" component={Orders} />
      <Route path="/profile" component={Profile} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/payment/failure" component={PaymentFailure} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CustomerAuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Layout>
              <Router />
            </Layout>
          </WouterRouter>
          <Toaster position="top-center" richColors dir="rtl" />
        </TooltipProvider>
      </CustomerAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
