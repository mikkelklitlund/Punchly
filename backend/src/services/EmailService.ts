import { IEmailService } from '../interfaces/services/IEmailService.js'
import nodemailer, { Transporter } from 'nodemailer'

export class SmtpEmailProvider implements IEmailService {
  private transporter: Transporter

  constructor() {
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_PORT ||
      !process.env.SMTP_SECURE ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS ||
      !process.env.SMTP_FROM
    ) {
      throw new Error('Fill out all required SMTP env variabless')
    }
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  private async sendMail(to: string, subject: string, text: string, html?: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
      html,
    })
  }

  async sendInviteEmail(to: string, signupUrl: string): Promise<void> {
    const subject = 'Opret manager konto'
    const text = `Du er blevet bedt om at oprette dig som manager, klik på dette link: ${signupUrl}`
    const html = `
      <p>Du er blevet bedt op at oprette dig som manager.</p>
      <p><a href="${signupUrl}">Opret dig</a></p>
    `
    await this.sendMail(to, subject, text, html)
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const subject = 'Gendan dit password'
    const text = `Gendan dit password ved at trykke på dette link: ${resetUrl}`
    const html = `
      <p>Klik på linket under for at gendanne dit password:</p>
      <p><a href="${resetUrl}">Gendan Password</a></p>
    `
    await this.sendMail(to, subject, text, html)
  }
}
