export enum UserRole {
  USER = "user",
  TEACHER = "teacher",
  ADMIN = "admin"
}

export interface User {
  id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profilePicture?: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  isEmailVerified: boolean;
  verificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

export interface UserLoginPayload {
  email: string;
  password: string;
}

export interface UserRegistrationPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserUpdatePayload {
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface JwtUserPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}