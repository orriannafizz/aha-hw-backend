import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { MailService } from '@sendgrid/mail';
import { BACKEND_URL, SEND_GRID_API_KEY } from '../../environment';
import { EMAIL_QUEUE } from '../../constants';
@Processor(EMAIL_QUEUE.QUEUE)
/**
 * Processor for handling email tasks in the background.
 */
export class MailProcessor {
  private mailService = new MailService();

  /**
   * Creates an instance of the MailProcessor and initializes the mail service with the SendGrid API key.
   */
  constructor() {
    this.mailService.setApiKey(SEND_GRID_API_KEY);
  }

  /**
   * Processes a job to send an email verification message.
   *
   * This method is triggered for jobs of type EMAIL_QUEUE.EVENTS.VERIFICATION.
   * It constructs and sends an email using the job's data, which includes the recipient's email address, username, and email verification token.
   *
   * @param {Job} job The job instance containing data for the email to be sent.
   */
  @Process(EMAIL_QUEUE.EVENTS.VERIFICATION)
  handleSendEmail(job: Job) {
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
