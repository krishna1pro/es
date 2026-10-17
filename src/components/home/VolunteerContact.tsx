/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { Calendar, MapPin, Clock, Mail, Phone, Globe, Youtube, Facebook, Instagram, Twitter, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  UpcomingEventsSectionData,
  VolunteerContactSectionData,
  EventItem
} from "@/src/types/homeCms";

export function UpcomingEvents({
  content,
  data: propData
}: {
  content?: any;
  data?: UpcomingEventsSectionData;
}) {
  const { t } = useTranslation();
  const eventsData: UpcomingEventsSectionData =
    propData || (content?.events ? content : content?.data) || {};

  const title = eventsData.title || t("events.title") || "Upcoming Events";
  const defaultEvents: EventItem[] = [
    { id: "e1", day: "25", month: "MAY", title: "Village Visit", location: "Ramanayapeta", time: "09:00 AM" },
    { id: "e2", day: "26", month: "MAY", title: "Public Meeting", location: "Siddapuram", time: "06:00 PM" },
    { id: "e3", day: "28", month: "MAY", title: "Welfare Program", location: "Government School", time: "10:00 AM" }
  ];

  const events =
    eventsData.events && eventsData.events.length > 0 ? eventsData.events : defaultEvents;
  const ctaText = eventsData.ctaText || t("events.fullCalendar") || "View Full Calendar";
  const ctaLink = eventsData.ctaLink || "/activities";

  return (
    <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm h-full flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-10 border-b border-slate-100 pb-4 flex items-center gap-2">
          <Calendar size={18} className="text-blue-600" /> {title}
        </h3>
        <div className="space-y-6">
          {events.map((e, i) => (
            <div
              key={e.id || i}
              className="flex gap-6 group cursor-pointer p-4 hover:bg-slate-50 transition-colors rounded-2xl border border-transparent hover:border-blue-100"
            >
              <div className="w-14 h-16 bg-blue-900 rounded-xl flex flex-col items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-lg font-black leading-none">{e.day}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-70 mt-1">
                  {e.month}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-black uppercase tracking-tight text-slate-800 mb-1">
                  {e.title}
                </p>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin size={10} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">
                      {e.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock size={10} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">{e.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Link
        to={ctaLink}
        className="block text-center w-full mt-10 py-3 border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-xl hover:bg-slate-50 transition-all"
      >
        {ctaText}
      </Link>
    </div>
  );
}

export function VolunteerContact({
  content,
  data: propData
}: {
  content?: any;
  data?: VolunteerContactSectionData;
}) {
  const { t } = useTranslation();
  const contactData: VolunteerContactSectionData =
    propData || (content?.contactTitle ? content : content?.data) || {};

  const volunteerTitle = contactData.volunteerTitle || t("volunteerCard.title") || "Join as Volunteer";
  const volunteerSubtitle =
    contactData.volunteerSubtitle || "Be part of the grassroots team working for real progress";
  const volunteerCtaText = contactData.volunteerCtaText || t("volunteerCard.cta") || "Register Now";
  const volunteerCtaLink = contactData.volunteerCtaLink || "/volunteer";

  const contactTitle = contactData.contactTitle || t("contactCard.title") || "Contact Us";
  const officeName = contactData.officeName || t("contactCard.office") || "Constituency Camp Office";
  const officeAddress =
    contactData.officeAddress || "Main Road, Ramanayapeta, Andhra Pradesh";
  const phone = contactData.phone || "+91 891 2345678";
  const helpline = contactData.helpline || "1902 (Toll Free)";
  const email = contactData.email || "office@chintadaravikumar.in";

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", location: "", interest: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 5000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Join as Volunteer */}
      <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden h-full flex flex-col justify-between">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Calendar size={120} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-2 border-b border-slate-100 pb-4 flex items-center gap-2">
            <Users size={18} className="text-green-600" /> {volunteerTitle}
          </h3>
          <p className="text-xs text-slate-500 mb-6">{volunteerSubtitle}</p>

          {formSubmitted ? (
            <div className="p-6 bg-green-50 border border-green-200 rounded-2xl text-center space-y-2 my-4">
              <p className="text-sm font-black text-green-800 uppercase tracking-wide">
                Thank you for signing up!
              </p>
              <p className="text-xs text-green-700 font-medium">
                Our constituency coordination team will reach out to you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("volunteerCard.name")}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:border-green-600 outline-none transition-all"
              />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t("volunteerCard.phone")}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:border-green-600 outline-none transition-all"
              />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={t("volunteerCard.location")}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:border-green-600 outline-none transition-all"
              />
              <div className="relative">
                <select
                  value={formData.interest}
                  onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:border-green-600 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">{t("volunteerCard.interest")}</option>
                  <option value="Youth Outreach">Youth Outreach</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Event Management">Event Management</option>
                  <option value="Ground Level Campaigning">Ground Level Campaigning</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-green-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-green-700 transition-all active:scale-[0.98]"
              >
                {volunteerCtaText}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Contact Us */}
      <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm h-full flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-10 border-b border-slate-100 pb-4 flex items-center gap-2">
            <Phone size={18} className="text-blue-600" /> {contactTitle}
          </h3>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-1">
                  {officeName}
                </p>
                <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-[280px]">
                  {officeAddress}
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
                <Phone size={24} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-1">
                  {t("contactCard.call")}
                </p>
                <p className="text-xs font-bold text-slate-500 tracking-widest">{phone}</p>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">Helpline: {helpline}</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-1">
                  {t("contactCard.email")}
                </p>
                <a
                  href={`mailto:${email}`}
                  className="text-xs font-bold text-slate-500 transition-colors hover:text-blue-800 cursor-pointer block"
                >
                  {email}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex gap-4 border-t border-slate-50 mt-8">
          <Link
            to="/contact"
            className="w-full py-3 text-center border-2 border-blue-50 text-[10px] font-black uppercase tracking-widest text-blue-800 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Visit Camp Office
          </Link>
        </div>
      </div>
    </div>
  );
}
