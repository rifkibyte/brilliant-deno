export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  creatorId: string;
  isPublished: boolean;
  difficulty: CourseDifficulty;
  estimatedHours?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  version: number;
}

export enum CourseDifficulty {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced"
}

export interface Section {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  content: string;
  contentType: ContentType;
  orderIndex: number;
  estimatedMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum ContentType {
  TEXT = "text",
  VIDEO = "video",
  QUIZ = "quiz",
  ASSIGNMENT = "assignment"
}

export interface Question {
  id: string;
  lessonId: string;
  content: string;
  type: QuestionType;
  options?: QuestionOption[];
  correctAnswers?: string[];
  explanation?: string;
  points: number;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum QuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  SINGLE_CHOICE = "single_choice",
  TRUE_FALSE = "true_false",
  OPEN_ENDED = "open_ended",
  FILL_BLANK = "fill_blank"
}

export interface QuestionOption {
  id: string;
  questionId: string;
  content: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface CourseCreationPayload {
  title: string;
  description: string;
  thumbnail?: string;
  difficulty: CourseDifficulty;
  estimatedHours?: number;
  tags?: string[];
}

export interface SectionCreationPayload {
  courseId: string;
  title: string;
  description?: string;
  orderIndex?: number;
}

export interface LessonCreationPayload {
  sectionId: string;
  title: string;
  content: string;
  contentType: ContentType;
  orderIndex?: number;
  estimatedMinutes?: number;
}