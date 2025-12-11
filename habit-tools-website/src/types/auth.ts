export interface User {
  id: string
  email: string
  displayName: string
  createdAt: string
}

export interface AuthSession {
  user: User
  token: string
}

export interface SignupData {
  email: string
  password: string
  displayName: string
}

export interface LoginData {
  email: string
  password: string
}
