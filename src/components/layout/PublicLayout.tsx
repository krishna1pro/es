/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Facebook, Twitter, Instagram, Youtube, ChevronRight, Globe, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SiteSettingsDocument } from "@/src/types/homeCms";
import { useSiteSettings } from "@/src/context/SiteSettingsContext";

interface PublicLayoutProps {
  children: React.ReactNode;
  settings?: SiteSettingsDocument | null;
}

export default function PublicLayout({ children, settings: propSettings }: PublicLayoutProps) {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const context = useSiteSettings();

  const settings = propSettings || context.settings;

  // Build nav links from MongoDB if configured, fallback to standard nav
  const isTelugu = i18n.language === "te";

  const mongoNavLinks = settings?.navLinks
    ?.filter((link) => link.isVisible !== false)
    ?.sort((a, b) => a.order - b.order)
    ?.map((link) => ({
      name: isTelugu && link.nameTe ? link.nameTe : link.name,
      path: link.path
    }));

  const fallbackNavLinks = [
    { name: t("nav.home"), path: "/" },
    { name: t("nav.about"), path: "/about" },
    { name: t("nav.vision"), path: "/vision" },
    { name: t("nav.activities"), path: "/activities" },
    { name: t("nav.development"), path: "/development" },
    { name: t("nav.publicVoice"), path: "/public-voice" },
    { name: t("nav.cadre"), path: "/cadre-corner" },
    { name: t("nav.media"), path: "/media-center" },
    { name: t("nav.contact"), path: "/contact" }
  ];

  const baseNav = mongoNavLinks && mongoNavLinks.length > 0 ? mongoNavLinks : fallbackNavLinks;

  const NAV_LINKS = [
    ...baseNav
  ];

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "te" : "en";
    i18n.changeLanguage(newLang);
  };

  const headerLogoText = settings?.logoText || "MLA";
  const headerTitle = settings?.siteName || t("nav.title");
  const headerTagline = settings?.tagline || t("nav.tagline");

  // Announcement bar from MongoDB
  const announcementEnabled = settings?.announcement ? settings.announcement.enabled : true;
  const announcementText =
    settings?.announcement?.text ||
    "Emergency helpline 1902 is now active for all rain-related distress. • New housing allotments for Phase 4 to be announced on Monday.";
  const announcementLink = settings?.announcement?.link;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="bg-white sticky top-0 z-50 h-14 border-b border-slate-100 shadow-xs">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-12 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-900 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-black text-base sm:text-lg shadow-xl transition-transform group-hover:rotate-12">
              {headerLogoText}
            </div>
            <div className="hidden xs:block">
              <h1 className="text-xs sm:text-sm font-black tracking-tighter text-slate-900 leading-none uppercase">
                {headerTitle}
              </h1>
              <p className="text-[6px] sm:text-[7px] text-blue-700 font-black tracking-[0.2em] uppercase mt-0.5 sm:mt-1">
                {headerTagline}
              </p>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-6">
            {NAV_LINKS.slice(0, 5).map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-[9px] font-black uppercase tracking-widest transition-all relative py-1 ${
                  pathname === link.path ? "text-blue-900" : "text-slate-400 hover:text-slate-900"
                }`}
              >
                {link.name}
                {pathname === link.path && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900"
                  />
                )}
              </Link>
            ))}

            {/* Dropdown for remaining links */}
            {NAV_LINKS.length > 5 && (
              <div className="relative group">
                <button className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all py-1">
                  More <ChevronRight size={10} className="rotate-90" />
                </button>
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-100 shadow-xl rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {NAV_LINKS.slice(5).map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`block px-5 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors ${
                        pathname === link.path ? "text-blue-900 bg-blue-50/50" : "text-slate-500"
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/volunteer"
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-blue-900 text-white text-[9px] font-black rounded-lg shadow-lg hover:bg-blue-800 transition-all uppercase tracking-widest active:scale-95"
            >
              {t("nav.volunteer")}
            </Link>

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-black text-slate-700 uppercase tracking-widest hover:bg-white hover:border-blue-900 transition-all shadow-sm"
              title="Switch language"
            >
              <Globe size={12} className="text-blue-700" />
              <span className="hidden sm:inline">
                {i18n.language === "en" ? "EN | తెలుగు" : "తెలుగు | EN"}
              </span>
              <span className="sm:hidden">{i18n.language === "en" ? "EN" : "TE"}</span>
            </button>

            <button
              className="xl:hidden p-1.5 text-slate-900"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Scrolling Announcement Ticker (Controlled by MongoDB site_settings) */}
      {announcementEnabled && (
        <div className="bg-slate-900 text-white h-8 sm:h-9 flex items-center overflow-hidden sticky top-14 z-40">
          <div className="bg-green-600 px-3 sm:px-4 h-full flex items-center text-[8px] sm:text-[9px] font-black uppercase tracking-widest z-20 relative shadow-[2px_0_10px_rgba(0,0,0,0.5)] shrink-0">
            Announcement
          </div>
          <div className="flex-grow overflow-hidden relative h-full flex items-center">
            {announcementLink ? (
              <Link
                to={announcementLink}
                className="flex whitespace-nowrap text-[9px] sm:text-[10px] font-bold tracking-wide animate-marquee items-center h-full hover:text-green-300 transition-colors"
              >
                <span className="pr-12">{announcementText}</span>
                <span className="pr-12">{announcementText}</span>
              </Link>
            ) : (
              <div className="flex whitespace-nowrap text-[9px] sm:text-[10px] font-bold tracking-wide animate-marquee items-center h-full">
                <span className="pr-12">{announcementText}</span>
                <span className="pr-12">{announcementText}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="xl:hidden bg-white border-b border-slate-200 overflow-hidden fixed top-14 inset-x-0 bottom-0 z-[60] pt-4"
          >
            <div className="px-6 py-4 flex flex-col gap-1 overflow-y-auto h-full pb-20">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path + link.name}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-4 rounded-xl text-sm font-black uppercase tracking-widest ${
                    pathname === link.path ? "bg-blue-50 text-blue-900" : "text-slate-400"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <button
                onClick={() => {
                  toggleLanguage();
                  setIsMenuOpen(false);
                }}
                className="mt-4 w-full py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-700 uppercase tracking-widest flex items-center justify-center gap-3"
              >
                <Globe size={18} className="text-blue-700" />
                <span>{i18n.language === "en" ? "తెలుగుకు మారండి" : "Switch to English"}</span>
              </button>
              <Link
                to="/volunteer"
                onClick={() => setIsMenuOpen(false)}
                className="mt-4 w-full py-4 bg-blue-900 text-white text-center rounded-xl font-black uppercase text-sm tracking-widest"
              >
                {t("nav.volunteer")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-grow">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          key={pathname}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer (Dynamic from MongoDB site_settings) */}
      <footer className="bg-white border-t border-slate-100 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {headerLogoText}
                </div>
                <span className="font-black text-slate-800 uppercase tracking-tighter text-sm">
                  {settings?.footer?.platformTitle || t("footer.platform")}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 leading-relaxed max-w-xs">
                {settings?.footer?.platformDescription ||
                  "A unified administrative interface for citizen engagement, transparent governance, and hyper-local service delivery."}
              </p>
              <div className="flex gap-4">
                {settings?.socialLinks?.facebook && (
                  <a
                    href={settings.socialLinks.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-300 hover:text-blue-700 transition-colors"
                  >
                    <Facebook size={18} />
                  </a>
                )}
                {settings?.socialLinks?.twitter && (
                  <a
                    href={settings.socialLinks.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-300 hover:text-sky-500 transition-colors"
                  >
                    <Twitter size={18} />
                  </a>
                )}
                {settings?.socialLinks?.instagram && (
                  <a
                    href={settings.socialLinks.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-300 hover:text-pink-600 transition-colors"
                  >
                    <Instagram size={18} />
                  </a>
                )}
                {settings?.socialLinks?.youtube && (
                  <a
                    href={settings.socialLinks.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-300 hover:text-red-600 transition-colors"
                  >
                    <Youtube size={18} />
                  </a>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">
                {t("footer.quickAccess")}
              </h4>
              <ul className="space-y-3">
                {NAV_LINKS.slice(1, 5).map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-[11px] font-bold text-slate-400 hover:text-blue-700 uppercase tracking-tight transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">
                {t("footer.resources")}
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/about"
                    className="text-[11px] font-bold text-slate-400 hover:text-blue-700 uppercase tracking-tight transition-colors"
                  >
                    Digital History
                  </Link>
                </li>
                <li>
                  <Link
                    to="/student-hub"
                    className="text-[11px] font-bold text-slate-400 hover:text-blue-700 uppercase tracking-tight transition-colors"
                  >
                    Scholarship Hub
                  </Link>
                </li>
                <li>
                  <Link
                    to="/media-center"
                    className="text-[11px] font-bold text-slate-400 hover:text-blue-700 uppercase tracking-tight transition-colors"
                  >
                    Media Assets
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">
                {t("footer.contact")}
              </h4>
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">
                    {t("footer.emailSupport")}
                  </p>
                  <p className="text-[11px] font-bold text-slate-500">
                    {settings?.contactEmail || "office@chintadaravikumar.in"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">
                    {t("footer.helpline")}
                  </p>
                  <p className="text-[11px] font-bold text-slate-500">
                    {settings?.helpline || "1902 (Toll Free)"}
                  </p>
                </div>
                {settings?.officeAddress && (
                  <div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">
                      Office Address
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 leading-snug">
                      {settings.officeAddress}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
              {settings?.footer?.copyrightText || t("footer.copyright")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
