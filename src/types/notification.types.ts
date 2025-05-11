export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  relatedEntityId?: string;
  relatedEntityType?: EntityType;
  createdAt: Date;
}

export enum NotificationType {
  COURSE_COMPLETION = "course_completion",
  BADGE_EARNED = "badge_earned",
  COURSE_UPDATE = "course_update",
  REMINDER = "reminder",
  ANNOUNCEMENT = "announcement",
  ACHIEVEMENT = "achievement"
}

export enum EntityType {
  COURSE = "course",
  SECTION = "section",
  LESSON = "lesson",
  BADGE = "badge",
  USER = "user"
}

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  courseUpdates: boolean;
  achievements: boolean;
  reminders: boolean;
  marketing: boolean;
  updatedAt: Date;
}