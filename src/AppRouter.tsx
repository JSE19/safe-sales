import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";

import Landing from "./pages/Landing";
import HowItWorks from "./pages/HowItWorks";
import ForSellers from "./pages/ForSellers";
import PublicListing from "./pages/PublicListing";
import Checkout from "./pages/Checkout";
import BuyerOrder from "./pages/BuyerOrder";
import Onboarding from "./pages/Onboarding";
import Admin from "./pages/Admin";
import Storefront from "./pages/Storefront";
import PayLink from "./pages/PayLink";

import DashboardHome from "./pages/app/DashboardHome";
import ListingsPage from "./pages/app/ListingsPage";
import OrdersPage from "./pages/app/OrdersPage";
import OrderDetailPage from "./pages/app/OrderDetailPage";
import EarningsPage from "./pages/app/EarningsPage";
import ReputationPage from "./pages/app/ReputationPage";
import DisputePage from "./pages/app/DisputePage";
import ChatPage from "./pages/app/ChatPage";
import PaymentRequestsPage from "./pages/app/PaymentRequestsPage";

import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Marketing */}
        <Route path="/" element={<Landing />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/for-sellers" element={<ForSellers />} />

        {/* Buyer flow */}
        <Route path="/buy/:id" element={<PublicListing />} />
        <Route path="/checkout/:id" element={<Checkout />} />
        {/* Buyer order page — token is the buyer's secret credential. */}
        <Route path="/order/:token" element={<BuyerOrder />} />

        {/* Public payment request */}
        <Route path="/pay/:code" element={<PayLink />} />

        {/* Seller onboarding */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Seller dashboard */}
        <Route path="/app" element={<DashboardHome />} />
        <Route path="/app/listings" element={<ListingsPage />} />
        <Route path="/app/orders" element={<OrdersPage />} />
        <Route path="/app/orders/:id" element={<OrderDetailPage />} />
        <Route path="/app/earnings" element={<EarningsPage />} />
        <Route path="/app/reputation" element={<ReputationPage />} />
        <Route path="/app/dispute" element={<DisputePage />} />
        <Route path="/app/dispute/:id" element={<DisputePage />} />
        <Route path="/app/chat" element={<ChatPage />} />
        <Route path="/app/payment-requests" element={<PaymentRequestsPage />} />

        {/* Admin / mediator */}
        <Route path="/admin" element={<Admin />} />

        {/* Public seller storefront — KEEP LAST so it doesn't shadow other routes. */}
        <Route path="/:handle" element={<Storefront />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;
