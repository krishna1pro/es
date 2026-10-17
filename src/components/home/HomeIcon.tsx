/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  MapPin,
  Users,
  CheckCircle,
  Heart,
  ThumbsUp,
  GraduationCap,
  Sprout,
  Briefcase,
  Venus,
  Zap,
  Waves,
  ShieldCheck,
  Clock,
  Calendar,
  Search,
  FileText,
  Activity,
  Building2,
  ShieldAlert,
  UserCheck,
  Image as ImageIcon,
  Video,
  Newspaper,
  Mic2,
  PlayCircle,
  ExternalLink,
  Phone,
  Mail,
  Globe,
  Youtube,
  Facebook,
  Instagram,
  Twitter,
  Star,
  Download,
  ChevronRight,
  ArrowRight,
  Share2,
  Flag,
  BookOpen,
  LucideProps
} from "lucide-react";

export const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  MapPin,
  Users,
  CheckCircle,
  Heart,
  ThumbsUp,
  GraduationCap,
  Sprout,
  Briefcase,
  Venus,
  Zap,
  Waves,
  ShieldCheck,
  Clock,
  Calendar,
  Search,
  FileText,
  Activity,
  Building2,
  ShieldAlert,
  UserCheck,
  Image: ImageIcon,
  ImageIcon,
  Video,
  Newspaper,
  Mic2,
  PlayCircle,
  ExternalLink,
  Phone,
  Mail,
  Globe,
  Youtube,
  Facebook,
  Instagram,
  Twitter,
  Star,
  Download,
  ChevronRight,
  ArrowRight,
  Share2,
  Flag,
  BookOpen
};

interface HomeIconProps extends LucideProps {
  name?: string;
  fallback?: React.FC<LucideProps>;
}

export default function HomeIcon({ name, fallback = Activity, ...props }: HomeIconProps) {
  if (!name) {
    const FallbackIcon = fallback;
    return <FallbackIcon {...props} />;
  }

  // Normalize name
  const normalizedKey = Object.keys(ICON_MAP).find(
    k => k.toLowerCase() === name.toLowerCase().replace(/[-_\s]/g, "")
  );

  const IconComponent = (normalizedKey ? ICON_MAP[normalizedKey] : null) || ICON_MAP[name] || fallback;
  return <IconComponent {...props} />;
}
