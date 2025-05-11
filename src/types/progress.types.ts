export interface UserProgress {
  id: string;
  userId: string;
  courseId: string;
  lastSectionId?: string;
  lastLessonId?: string;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  startedAt: Date;
  lastAccessedAt: Date;
  completedAt?: Date;
  isCompleted: boolean;
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  sectionId: string;
  courseId: string;
  status: ProgressStatus;
  timeSpentSeconds: number;
  startedAt: Date;
  completedAt?: Date;
}

export enum ProgressStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed"
}

export interface UserAnswer {
  id: string;
  userId: string;
  questionId: string;
  lessonId: string;
  courseId: string;
  answer: string | string[];
  isCorrect: boolean;
  points: number;
  attemptedAt: Date;
}

export interface UserScore {
  id: string;
  userId: string;
  courseId: string;
  totalPoints: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  updatedAt: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  image: string;
  criteria: BadgeCriteria;
  createdAt: Date;
}

export enum BadgeCriteria {
  COURSE_COMPLETION = "course_completion",
  STREAK = "streak",
  PERFECT_SCORE = "perfect_score",
  QUESTIONS_ANSWERED = "questions_answered",
  TIME_SPENT = "time_spent"
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: Date;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  profilePicture?: string;
  score: number;
  rank: number;
}

export interface LeaderboardFilter {
  courseId?: string;
  period?: LeaderboardPeriod;
  limit?: number;
  offset?: number;
}

export enum LeaderboardPeriod {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  ALL_TIME = "all_time"
}