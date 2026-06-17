import React from "react";
import { motion } from "motion/react";
import { Calendar, MapPin, Clock, Mail, Phone, Globe, Facebook, Instagram, Twitter, Youtube, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

export function UpcomingEvents() {
  const { t } = useTranslation();
  const events = [
    { day: "25", month: "MAY", title: "Village Visit", location: "Ramanayapeta", time: "09:00 AM" },
    { day: "26", month: "MAY", title: "Public Meeting", location: "Siddapuram", time: "06:00 PM" },
    { day: "28", month: "MAY", title: "Welfare Program", location: "Government School", time: "10:00 AM" },
  ];

  return (
    <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm h-full">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-10 border-b border-slate-100 pb-4 flex items-center gap-2">
        <Calendar size={18} className="text-blue-600" /> {t('events.title')}
      </h3>
      <div className="space-y-6">
        {events.map((e, i) => (
          <div key={i} className="flex gap-6 group cursor-pointer p-4 hover:bg-slate-50 transition-colors rounded-2xl border border-transparent hover:border-blue-100">
            <div className="w-14 h-16 bg-blue-900 rounded-xl flex flex-col items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-lg font-black leading-none">{e.day}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-70 mt-1">{e.month}</span>
            </div>
            <div className="min-w-0">
               <p className="text-[12px] font-black uppercase tracking-tight text-slate-800 mb-1">{e.title}</p>
               <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin size={10} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">{e.location}</span>
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
      <button className="w-full mt-10 py-3 border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-xl hover:bg-slate-50 transition-all">
        {t('events.fullCalendar')}
      </button>
    </div>
  );
}

export function VolunteerContact() {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Join as Volunteer */}
      <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden h-full">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Calendar size={120} />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-10 border-b border-slate-100 pb-4 flex items-center gap-2">
          <Users size={18} className="text-green-600" /> {t('volunteerCard.title')}
        </h3>
        <form className="space-y-4">
          <input type="text" placeholder={t('volunteerCard.name')} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:border-green-600 outline-none transition-all" />
          <input type="tel" placeholder={t('volunteerCard.phone')} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:border-green-600 outline-none transition-all" />
          <input type="text" placeholder={t('volunteerCard.location')} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:border-green-600 outline-none transition-all" />
          <div className="relative">
            <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase tracking-widest focus:bg-white focus:border-green-600 outline-none transition-all appearance-none cursor-pointer">
              <option>{t('volunteerCard.interest')}</option>
              <option>Youth Outreach</option>
              <option>Social Media</option>
              <option>Event Management</option>
              <option>Ground Level Campaigning</option>
            </select>
          </div>
          <button className="w-full py-4 bg-green-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-green-700 transition-all active:scale-[0.98]">
            {t('volunteerCard.cta')}
          </button>
        </form>
      </div>

      {/* Contact Us */}
      <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm h-full">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-10 border-b border-slate-100 pb-4 flex items-center gap-2">
          <Phone size={18} className="text-blue-600" /> {t('contactCard.title')}
        </h3>
        <div className="space-y-8">
           <div className="flex gap-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-1">{t('contactCard.office')}</p>
                <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-[200px]">Near Bus Stand, Main Road, Your Constituency - 123456</p>
              </div>
           </div>
           
           <div className="flex gap-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
                <Phone size={24} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-1">{t('contactCard.call')}</p>
                <p className="text-xs font-bold text-slate-500 tracking-widest">+91 98765 43210</p>
              </div>
           </div>

           <div className="flex gap-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-1">{t('contactCard.email')}</p>
                <p className="text-xs font-bold text-slate-500 transition-colors hover:text-blue-800 cursor-pointer">leadername@gmail.com</p>
              </div>
           </div>

           <div className="flex gap-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
                <Globe size={24} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-1">Website</p>
                <p className="text-xs font-bold text-slate-500 transition-colors hover:text-blue-800 cursor-pointer">www.leadername.in</p>
              </div>
           </div>

           <div className="pt-6 flex gap-6">
              <div className="flex gap-4">
                 {[Youtube, Facebook, Instagram, Twitter].map((Icon, i) => (
                    <a key={i} href="#" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-blue-800 hover:text-white transition-all shadow-sm">
                       <Icon size={18} />
                    </a>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
