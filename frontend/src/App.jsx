import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  useLocation,
  Link,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ShopProvider } from "./context/ShopContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Frames from "./pages/Frames";
import Categories from "./pages/Categories";
import FrameDetails from "./pages/FrameDetails";
import Contact from "./pages/Contact";
import Gifts from "./pages/Gifts";
import GiftDetails from "./pages/GiftDetails";
import ManageGifts from "./admin/ManageGifts";
import GiftForm from "./admin/GiftForm";
import ManageGiftCategories from "./admin/ManageGiftCategories";
import Login from "./admin/Login";
import ProtectedRoute from "./admin/ProtectedRoute";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/Dashboard";
import ManageFrames from "./admin/ManageFrames";
import FrameForm from "./admin/FrameForm";
import ManageCategories from "./admin/ManageCategories";
import Settings from "./admin/Settings";
import AdminManagement from "./admin/AdminManagement";
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
function PublicLayout() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <ShopProvider>
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="frames" element={<Frames />} />
              <Route path="frames/:id" element={<FrameDetails />} />
              <Route path="gifts" element={<Gifts />} />
              <Route path="gifts/:id" element={<GiftDetails />} />
              <Route path="categories" element={<Categories />} />
              <Route path="contact" element={<Contact />} />
              <Route
                path="*"
                element={
                  <div className="container not-found">
                    <div className="eyebrow">A SMALL DETOUR</div>
                    <h1>This page hasn’t found its frame.</h1>
                    <Link className="button button-gold" to="/">
                      Back to home
                    </Link>
                  </div>
                }
              />
            </Route>
            <Route path="login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="frames" element={<ManageFrames />} />
                <Route path="frames/add" element={<FrameForm />} />
                <Route path="frames/edit/:id" element={<FrameForm />} />
                <Route path="categories" element={<ManageCategories />} />
                <Route path="gifts" element={<ManageGifts />} />
                <Route path="gifts/add" element={<GiftForm />} />
                <Route path="gifts/edit/:id" element={<GiftForm />} />
                <Route
                  path="gift-categories"
                  element={<ManageGiftCategories />}
                />
                <Route path="settings" element={<Settings />} />
                <Route path="admins" element={<AdminManagement />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </ShopProvider>
    </BrowserRouter>
  );
}
