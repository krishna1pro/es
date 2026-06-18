import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          nav: {
            home: "Home",
            about: "About",
            vision: "Vision",
            activities: "Activities",
            development: "Development",
            publicVoice: "Public Voice",
            cadre: "Cadre Corner",
            media: "Media",
            contact: "Contact",
            volunteer: "Volunteer",
            title: "MLA WEB",
            tagline: "Vision • Integrity • Action"
          },
          redesign: {
            title: "Redesign",
          },
          hero: {
            people: "PEOPLE",
            first: "FIRST",
            development: "DEVELOPMENT",
            always: "ALWAYS",
            subtitle: "An Educated | Energetic | Hardworking Leader",
            subtext: "Working for the People, With the People",
            latestActivities: "Latest Activities",
            peoplesVoice: "People's Voice",
            joinMovement: "Join Movement",
            followUs: "Follow us on",
            todayHighlights: "Today's Highlights",
            fullSchedule: "Full Schedule"
          },
          leader: {
            title: "Leader's Profile",
            cta: "Full Biography",
            academic: "Academic Excellence",
            grassroots: "Grassroots Connection",
            social: "Social Transformation",
            party: "Party Visionary",
            constituency: "Constituency Focus",
            committed: "Committed Leadership"
          },
          sections: {
            vision: "Strategic Vision",
            visionCta: "Explore Implementation",
            activities: "Leadership in Action",
            activitiesCta: "Detailed Activity Logs",
            development: "District Transformation",
            developmentCta: "Launch Dashboard",
            dialogue: "Democracy & Dialogue",
            publicPosts: "Public Posts",
            cadreWorkspace: "Cadre Workspace",
            media: "Media & Press",
            viewArchive: "View Archive",
            upcomingEvents: "Upcoming Events"
          },
          stats: {
            villages: "Villages Visited",
            meetings: "Public Meetings",
            resolved: "Issues Resolved",
            volunteers: "Active Volunteers",
            benefited: "People Benefited",
            followers: "Social Media Followers"
          },
          events: {
            title: "Upcoming Events",
            fullCalendar: "View Full Calendar"
          },
          volunteerCard: {
            title: "Join as Volunteer",
            name: "Full Name",
            phone: "Mobile Number",
            location: "Village / Town",
            interest: "Select Interest Area",
            cta: "Register Now"
          },
          contactCard: {
            title: "Contact Us",
            office: "Constituency Office",
            call: "Call Us",
            email: "Email Us"
          },
          footer: {
            quickAccess: "Quick Access",
            resources: "Resources",
            contact: "Contact",
            emailSupport: "Email Support",
            helpline: "Helpline",
            copyright: "© 2026 District Administration • MLA Portal",
            management: "Portal Management",
            platform: "District Platform"
          }
        }
      },
      te: {
        translation: {
          nav: {
            home: "హోమ్",
            about: "గురించి",
            vision: "దృష్టి",
            activities: "కార్యకలాపాలు",
            development: "అభివృద్ధి",
            publicVoice: "ప్రజా గొంతుక",
            cadre: "క్యాడర్ కార్నర్",
            media: "మీడియా",
            contact: "సంప్రదించండి",
            volunteer: "వాలంటీర్",
            title: "ఎమ్మెల్యే వెబ్",
            tagline: "దర్శనం • సమగ్రత • చర్య"
          },
          redesign: {
            title: "పునఃరూపకల్పన",
          },
          hero: {
            people: "ప్రజలు",
            first: "మొదట",
            development: "అభివృద్ధి",
            always: "ఎల్లప్పుడూ",
            subtitle: "విద్యావంతుడు | ఉత్సాహవంతుడు | కష్టపడి పనిచేసే నాయకుడు",
            subtext: "ప్రజల కోసం, ప్రజలతో కలిసి పనిచేయడం",
            latestActivities: "తాజా కార్యకలాపాలు",
            peoplesVoice: "ప్రజా గొంతుక",
            joinMovement: "ఉద్యమంలో చేరండి",
            followUs: "మమ్మల్ని అనుసరించండి",
            todayHighlights: "నేటి ముఖ్యాంశాలు",
            fullSchedule: "పూర్తి షెడ్యూల్"
          },
          leader: {
            title: "నాయకుడి ప్రొఫైల్",
            cta: "పూర్తి జీవిత చరిత్ర",
            academic: "విద్యా నైపుణ్యం",
            grassroots: "అట్టడుగు స్థాయి సంబంధం",
            social: "సామాజిక మార్పు",
            party: "పార్టీ విజనరీ",
            constituency: "నియోజకవర్గ దృష్టి",
            committed: "కట్టుబడి ఉన్న నాయకత్వం"
          },
          sections: {
            vision: "వ్యూహాత్మక దృష్టి",
            visionCta: "అమలును అన్వేషించండి",
            activities: "చర్యలో నాయకత్వం",
            activitiesCta: "వివరణాత్మక కార్యకలాపాల లాగ్‌లు",
            development: "జిల్లా పరివర్తన",
            developmentCta: "డాష్‌బోర్డ్‌ను ప్రారంభించండి",
            dialogue: "ప్రజాస్వామ్యం & సంభాషణ",
            publicPosts: "పబ్లిక్ పోస్ట్లు",
            cadreWorkspace: "క్యాడర్ వర్క్‌స్పేస్",
            media: "మీడియా & ప్రెస్",
            viewArchive: "ఆర్కైవ్ చూడండి",
            upcomingEvents: "రాబోయే ఈవెంట్స్"
          },
          stats: {
            villages: "సందర్శించిన గ్రామాలు",
            meetings: "బహిరంగ సభలు",
            resolved: "పరిష్కరించబడిన సమస్యలు",
            volunteers: "క్రియాశీల వాలంటీర్లు",
            benefited: "ప్రజలు ప్రయోజనం పొందారు",
            followers: "సోషల్ మీడియా ఫాలోవర్స్"
          },
          events: {
            title: "రాబోయే ఈవెంట్స్",
            fullCalendar: "పూర్తి క్యాలెండర్‌ను చూడండి"
          },
          volunteerCard: {
            title: "వాలంటీర్‌గా చేరండి",
            name: "పూర్తి పేరు",
            phone: "మొబైల్ సంఖ్య",
            location: "గ్రామం / పట్టణం",
            interest: "ఆసక్తి ఉన్న ప్రాంతాన్ని ఎంచుకోండి",
            cta: "ఇప్పుడే నమోదు చేసుకోండి"
          },
          contactCard: {
            title: "మమ్మల్ని సంప్రదించండి",
            office: "నియోజకవర్గ కార్యాలయం",
            call: "మాకు కాల్ చేయండి",
            email: "మాకు ఇమెయిల్ చేయండి"
          },
          footer: {
            quickAccess: "శీఘ్ర ప్రాప్తి",
            resources: "వనరులు",
            contact: "సంప్రదించండి",
            emailSupport: "ఇమెయిల్ మద్దతు",
            helpline: "హెల్ప్‌లైన్",
            copyright: "© 2026 జిల్లా యంత్రాంగం • ఎమ్మెల్యే పోర్టల్",
            management: "పోర్టల్ నిర్వహణ",
            platform: "జిల్లా ప్లాట్‌ఫాం"
          }
        }
      }
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
