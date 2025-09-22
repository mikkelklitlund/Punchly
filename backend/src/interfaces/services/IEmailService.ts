export interface IEmailService {
  sendInviteEmail(to: string, signupUrl: string): Promise<void>
  sendPasswordResetEmail(to: string, resetUrl: string): Promise<void>
}
