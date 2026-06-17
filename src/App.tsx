/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/src/db/firebase";
import { doc, getDoc } from "firebase/firestore";
import { UserProfile, UserStatus } from "./types";

// Pages (to be created)
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
import AdminAccess from "./pages/AdminAccess";
import AdminDashboard from "./pages/AdminDashboard";
import CMSManager from "./pages/CMSManager";
import ArticleManager from "./pages/ArticleManager";
import VolunteerManager from "./pages/VolunteerManager";
import GrievanceManager from "./pages/GrievanceManager";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import UserManagement from "./pages/UserManagement";
import AdminMediaCenter from "./pages/AdminMediaCenter";
import WaitingRoom from "./pages/WaitingRoom";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      const mockUserId = localStorage.getItem("mock_user_id");
      
      // If mock user exists, prioritize it for testing
      if (mockUserId) {
        try {
          const userDoc = await getDoc(doc(db, "users", mockUserId));
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Mock login error:", err);
        }
      }

      // Fallback to Firebase Auth
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    };

    const unsubscribePromise = initApp();
    return () => {
      unsubscribePromise.then(unsub => unsub?.());
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  const isAdmin = user && (user.status === UserStatus.APPROVED || user.uid.startsWith('mock_'));

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/vision" element={<Vision />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/development" element={<Development />} />
        <Route path="/public-voice" element={<PublicVoice />} />
        <Route path="/cadre-corner" element={<CadreCorner />} />
        <Route path="/media-center" element={<MediaCenter />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/volunteer" element={<Volunteer />} />
        
        {/* Admin Access & auth (HIDDEN URL) */}
        <Route path="/leadership-control-center" element={<AdminAccess user={user} />} />
        <Route path="/waiting-room" element={<WaitingRoom user={user} />} />

        {/* Protected Admin Routes */}
        {isAdmin ? (
          <Route path="/admin">
            <Route index element={<AdminDashboard user={user} />} />
            <Route path="cms" element={<CMSManager />} />
            <Route path="media" element={<AdminMediaCenter />} />
            <Route path="articles" element={<ArticleManager />} />
            <Route path="volunteers" element={<VolunteerManager />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="grievances" element={<GrievanceManager />} />
            <Route path="analytics" element={<AnalyticsDashboard user={user} />} />
            <Route path="*" element={<Navigate to="/admin" />} />
          </Route>
        ) : (
          <Route path="/admin/*" element={<Navigate to="/leadership-control-center" />} />
        )}
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
