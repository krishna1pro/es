/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// YSRCP Theme Colors
export const COLORS = {
  PRIMARY_BLUE: "#004B8D", // Blue from the flag
  PRIMARY_GREEN: "#009B4D", // Green from the flag
  WHITE: "#FFFFFF",
  LIGHT_GRAY: "#F8F9FA",
  ACCENT_RED: "#ED1C24", // Red for warnings/important
};

export enum UserStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export enum ArticleType {
  NEWS = "NEWS",
  EVENT = "EVENT",
  PROJECT = "PROJECT",
  SUCCESS_STORY = "SUCCESS_STORY",
  SCHEME = "SCHEME",
  SCHOLARSHIP = "SCHOLARSHIP"
}

export enum ArticleStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED"
}

export enum VolunteerStatus {
  VISITOR = "VISITOR",
  INTERESTED = "INTERESTED",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  ACTIVE = "ACTIVE"
}

export enum GrievanceStatus {
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  ASSIGNED = "ASSIGNED",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED"
}

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  GENERAL_ADMINISTRATOR = "ADMIN",
  WEBSITE_CMS_MANAGER = "WEBSITE_CMS_MANAGER",
  CONTENT_EDITOR = "CONTENT_EDITOR",
  MEDIA_ADMINISTRATOR = "MEDIA_ADMINISTRATOR",
  MEDIA_PUBLISHER = "MEDIA_PUBLISHER",
  MEDIA_CONTRIBUTOR = "MEDIA_CONTRIBUTOR",
  SOCIAL_MEDIA_MANAGER = "SOCIAL_MEDIA_MANAGER",
  PUBLIC_SUBMISSIONS_MANAGER = "PUBLIC_SUBMISSIONS_MANAGER",
  GRIEVANCE_MANAGER = "GRIEVANCE_MANAGER",
  TEAM_ACCESS_COORDINATOR = "TEAM_ACCESS_COORDINATOR",
  RESEARCH_POLICY_ANALYST = "RESEARCH_POLICY_ANALYST",
  EVENTS_VOLUNTEER_COORDINATOR = "EVENTS_VOLUNTEER_COORDINATOR",
  ANALYTICS_AUDIT_VIEWER = "ANALYTICS_AUDIT_VIEWER",
  OFFICE_STAFF = "OFFICE_STAFF",
  READ_ONLY_OBSERVER = "VIEWER",
  // Legacy compatibility aliases
  CONTENT_MANAGER = "CONTENT_MANAGER",
  MEDIA_MANAGER = "MEDIA_MANAGER",
  EVENT_MANAGER = "EVENT_MANAGER",
  VOLUNTEER_MANAGER = "VOLUNTEER_MANAGER",
  CADRE_MANAGER = "CADRE_MANAGER",
  ANALYTICS_MANAGER = "ANALYTICS_MANAGER",
  OUTREACH_MANAGER = "OUTREACH_MANAGER",
  RESEARCH_MANAGER = "RESEARCH_MANAGER",
  PUBLIC_RELATIONS_MANAGER = "PUBLIC_RELATIONS_MANAGER",
  OFFICE_MANAGER = "OFFICE_MANAGER",
  APPROVAL_AUTHORITY = "APPROVAL_AUTHORITY",
  VIEWER = "VIEWER"
}

export enum PermissionAction {
  VIEW = "VIEW",
  CREATE = "CREATE",
  EDIT = "EDIT",
  DELETE = "DELETE",
  PUBLISH = "PUBLISH",
  APPROVE = "APPROVE",
  EXPORT = "EXPORT",
  ASSIGN = "ASSIGN"
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  status: UserStatus;
  permissions: string[]; // e.g., ["*"] or specific action permissions
  assignedSections?: string[]; // Granular Home Page section IDs assigned to edit
  requestedRole?: string;
  requestNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  notes?: string;
  createdAt: string;
  lastLogin: string;
}

export interface AdminUserDocument extends UserProfile {
  _id?: string;
  updatedAt?: string;
}

export interface AuditLogDocument {
  _id?: string;
  timestamp: string;
  actorUid: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetEntity: string;
  targetId?: string;
  details?: Record<string, any> | string;
  ipAddress?: string;
}


export interface CMSSection {
  id: string;
  type: "hero" | "stats" | "about_leader" | "leadership_journey" | "vision_grid" | "daily_activities" | "monthly_activities" | "yearly_report" | "development_projects" | "peoples_voice" | "cadre_corner" | "media_center" | "social_hub" | "upcoming_events" | "contact_info";
  content: any;
  order: number;
}

export interface CMSPage {
  id: string;
  title: string;
  slug: string;
  description: string;
  sections: CMSSection[];
  updatedAt: string;
  updatedBy: string;
}

export interface Article {
  id: string;
  type: ArticleType;
  title: string;
  content: string;
  thumbnail?: string;
  status: ArticleStatus;
  publishedAt: string;
  author: string;
  category?: string;
  metadata?: any;
}

export interface Grievance {
  id: string;
  userId?: string;
  category: string;
  subject: string;
  description: string;
  attachments: string[];
  status: GrievanceStatus;
  trackingNumber: string;
  createdAt: string;
  notes?: any[];
}

export interface Volunteer {
  uid: string;
  status: VolunteerStatus;
  skills: string[];
  interests: string[];
  activities: any[];
}

export interface AnalyticsEvent {
  id: string;
  uid?: string;
  eventName: string;
  path: string;
  properties: any;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  uid: string;
  email: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
}

export interface DistrictConfig {
  id: string;
  name: string;
  leadership: {
    chiefMinister: {
      name: string;
      image: string;
      message: string;
    };
    districtCollector: {
      name: string;
      image: string;
      message: string;
    };
  };
  statistics: {
    population: string;
    area: string;
    literacyRate: string;
    mandals: number;
  };
  social: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
}
