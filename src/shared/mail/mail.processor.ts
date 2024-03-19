import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { MailService } from '@sendgrid/mail';
import { BACKEND_URL, SEND_GRID_API_KEY } from '../../environment';
import { EMAIL_QUEUE } from 'src/constants';

@Processor(EMAIL_QUEUE.QUEUE)
export class MailProcessor {
  mailService = new MailService();

  constructor() {
    this.mailService.setApiKey(SEND_GRID_API_KEY);
  }

  @Process(EMAIL_QUEUE.EVENTS.VERIFICATION)
  async handleSendEmail(job: Job) {
    const { username, email, emailVerifyToken } = job.data;
    const msg = {
      to: email,
      from: 'brianahaha@oppal.gg',
      subject: `${username}'s Verification Email`,
      html: `
      <html>
      <body>
        <p>Hello ${username},</p>
        <p>To complete your email verification, please click the button below:</p>
        <a href="${BACKEND_URL}/users/verify-email/${emailVerifyToken}" style="background-color: black; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; font-weight: bold; font-size: 16px; border: none; border-radius: 5px;">Verify Email</a>
      </body>
      </html>
      `,
    };

    this.mailService
      .send(msg)
      .then(() => {
        console.log(
          `verify email to ${email} sent successfully, token: ${emailVerifyToken}`,
        );
      })
      .catch((error) => {
        console.error('Error sending email', error);
        throw error;
      });
  }
}
