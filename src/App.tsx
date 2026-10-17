/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { UserStatus } from "./types";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useUrlSanitizer } from "./lib/useUrlSanitizer";

// Public Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Leadership from "./pages/Leadership";
import PublicVoice from "./pages/PublicVoice";
import Volunteer from "./pages/Volunteer";
import Development from "./pages/Development";
import StudentHub from "./pages/StudentHub";
import MediaCenter from "./pages/MediaCenter";
import Vision from "./pages/Vision";
import Activities from "./pages/Activities";
import CadreCorner from "./pages/CadreCorner";
import Contact from "./pages/Contact";
import Redesign from "./pages/Redesign";

// Administrative Access & Protected Pages
import AdminAccess from "./pages/AdminAccess";
import WaitingRoom from "./pages/WaitingRoom";
import AdminDashboard from "./pages/AdminDashboard";
import CMSManager from "./pages/CMSManager";
import ArticleManager from "./pages/ArticleManager";
import VolunteerManager from "./pages/VolunteerManager";
import GrievanceManager from "./pages/GrievanceManager";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import UserManagement from "./pages/UserManagement";
import AdminMediaCenter from "./pages/AdminMediaCenter";
import SubmissionsManager from "./pages/SubmissionsManager";

function UrlSanitizerListener() {
  useUrlSanitizer();
  return null;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          Securing Administrative Connection...
        </p>
      </div>
    );
  }

  const isApproved = user && user.status === UserStatus.APPROVED;

  return (
    <Router>
      <UrlSanitizerListener />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/leadership" element={<Leadership />} />
        <Route path="/vision" element={<Vision />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/development" element={<Development />} />
        <Route path="/public-voice" element={<PublicVoice />} />
        <Route path="/cadre-corner" element={<CadreCorner />} />
        <Route path="/media-center" element={<MediaCenter />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/volunteer" element={<Volunteer />} />
        <Route path="/students" element={<StudentHub />} />
        <Route path="/redesign" element={<Redesign />} />

        {/* Administrative Access & Verification Flow */}
        <Route path="/leadership-control-center" element={<AdminAccess user={user} />} />
        <Route path="/waiting-room" element={<WaitingRoom user={user} />} />

        {/* Common Administrative & Login Aliases */}
        <Route path="/admin/login" element={<Navigate to="/leadership-control-center" replace />} />
        <Route path="/login" element={<Navigate to="/leadership-control-center" replace />} />

        {/* Protected Administrative Routes */}
        {isApproved ? (
          <Route path="/admin">
            <Route index element={<AdminDashboard user={user} />} />
            <Route path="cms" element={<CMSManager />} />
            <Route path="media" element={<AdminMediaCenter />} />
            <Route path="submissions" element={<SubmissionsManager />} />
            <Route path="articles" element={<ArticleManager />} />
            <Route path="volunteers" element={<VolunteerManager />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="grievances" element={<GrievanceManager />} />
            <Route path="analytics" element={<AnalyticsDashboard user={user} />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        ) : (
          <>
            <Route
              path="/admin"
              element={
                user && user.status === UserStatus.PENDING ? (
                  <Navigate to="/waiting-room" replace />
                ) : (
                  <Navigate to="/leadership-control-center" replace />
                )
              }
            />
            <Route
              path="/admin/*"
              element={
                user && user.status === UserStatus.PENDING ? (
                  <Navigate to="/waiting-room" replace />
                ) : (
                  <Navigate to="/leadership-control-center" replace />
                )
              }
            />
          </>
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <SiteSettingsProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </SiteSettingsProvider>
  );
}
