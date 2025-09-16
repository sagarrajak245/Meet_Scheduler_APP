
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.FROM_EMAIL!;

// Define simple types for user objects for clarity
type MailUser = { name: string; email: string; };
type BookingDetails = {
    startTime: Date;
    endTime: Date;
    title: string;
    description?: string;
    googleMeetLink?: string | null;
};

export class EmailService {
    async sendBookingConfirmation(booking: BookingDetails, seller: MailUser, buyer: MailUser) {
        try {
            const { subject, buyerHtml, sellerHtml } = this.generateBookingConfirmationTemplate(booking, seller, buyer);

            // Send email to the buyer
            await resend.emails.send({
                from: fromEmail,
                to: buyer.email,
                subject: `Confirmation: ${subject}`,
                html: buyerHtml,
            });

            // Send email to the seller
            await resend.emails.send({
                from: fromEmail,
                to: seller.email,
                subject: `New Booking: ${subject}`,
                html: sellerHtml,
            });

        } catch (error) {
            console.error("Failed to send booking confirmation email:", error);
        }
    }

    async sendReminder(booking: BookingDetails & { _id: string }, user: MailUser, minutesBefore: number) {
        try {
            const { subject, html } = this.generateReminderTemplate(booking, user, minutesBefore);

            await resend.emails.send({
                from: fromEmail,
                to: user.email,
                subject: `Reminder: ${subject}`,
                html,
            });

        } catch (error) {
            console.error(`Failed to send ${minutesBefore}-min reminder for booking ${booking._id}:`, error);
        }
    }

    async sendBookingCancellation(booking: BookingDetails, seller: MailUser, buyer: MailUser, cancelledBy: 'seller' | 'buyer') {
        try {
            const { subject, html } = this.generateCancellationTemplate(booking, seller, buyer, cancelledBy);

            await resend.emails.send({ from: fromEmail, to: buyer.email, subject, html });
            await resend.emails.send({ from: fromEmail, to: seller.email, subject, html });

        } catch (error) {
            console.error("Failed to send booking cancellation email:", error);
        }
    }

    private generateBookingConfirmationTemplate(booking: BookingDetails, seller: MailUser, buyer: MailUser) {
        const formatEventDate = (date: Date) => {
            return new Intl.DateTimeFormat('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short',
            }).format(date);
        };

        const subject = `${booking.title} with ${seller.name}`;
        const formattedTime = formatEventDate(booking.startTime);
        const duration = (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60);

        const commonContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #f7f7f7; padding: 20px; border-bottom: 1px solid #ddd;">
                <h2 style="margin: 0; color: #333;">Appointment Confirmed</h2>
                <p style="margin: 5px 0 0; color: #555;">${subject}</p>
            </div>
            <div style="padding: 20px;">
                <p><strong>When:</strong> ${formattedTime}</p>
                <p><strong>Duration:</strong> ${duration} minutes</p>
                ${booking.description ? `<p><strong>Notes:</strong> ${booking.description}</p>` : ''}
            </div>
            ${booking.googleMeetLink ? `
            <div style="padding: 0 20px 20px;">
                <a href="${booking.googleMeetLink}" style="background-color: #007bff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Join Google Meet
                </a>
            </div>` : ''}
            <div style="background-color: #f7f7f7; padding: 15px 20px; text-align: center; color: #888; font-size: 12px;">
                <p style="margin: 0;">This event has also been added to your Google Calendar.</p>
                <p style="margin: 5px 0 0;">Powered by Scheduler App</p>
            </div>
        </div>
    `;

        const buyerHtml = `
        <p style="font-family: Arial, sans-serif;">Hi ${buyer.name},</p>
        <p style="font-family: Arial, sans-serif;">Your appointment with ${seller.name} is confirmed. Here are the details:</p>
        ${commonContent}
    `;

        const sellerHtml = `
        <p style="font-family: Arial, sans-serif;">Hi ${seller.name},</p>
        <p style="font-family: Arial, sans-serif;">You have a new booking from ${buyer.name}. Here are the details:</p>
        ${commonContent}
    `;

        return { subject, buyerHtml, sellerHtml };
    }

    private generateReminderTemplate(booking: BookingDetails, user: MailUser, minutesBefore: number) {
        const formatEventTime = (date: Date) => {
            return new Intl.DateTimeFormat('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short',
            }).format(date);
        };

        const subject = `Upcoming Appointment at ${formatEventTime(booking.startTime)}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                <div style="background-color: #f0f8ff; padding: 20px;">
                    <h2 style="margin: 0; color: #333;">Appointment Reminder</h2>
                </div>
                <div style="padding: 20px;">
                    <p>Hi ${user.name},</p>
                    <p>This is a reminder that you have an appointment starting in approximately <strong>${minutesBefore} minutes</strong>.</p>
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-top: 20px;">
                        <p><strong>Title:</strong> ${booking.title}</p>
                        <p><strong>Time:</strong> ${formatEventTime(booking.startTime)}</p>
                    </div>
                    ${booking.googleMeetLink ? `
                    <div style="padding-top: 20px; text-align: center;">
                        <a href="${booking.googleMeetLink}" style="background-color: #007bff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Join Google Meet
                        </a>
                    </div>` : ''}
                </div>
            </div>
        `;
        return { subject, html };
    }

    private generateCancellationTemplate(booking: BookingDetails, seller: MailUser, buyer: MailUser, cancelledBy: 'seller' | 'buyer') {
        const subject = `Cancelled: ${booking.title}`;
        const cancellerName = cancelledBy === 'seller' ? seller.name : buyer.name;

        const formatEventDate = (date: Date) => {
            return new Intl.DateTimeFormat('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(date);
        };

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                <div style="background-color: #fff0f0; padding: 20px; text-align: center;">
                    <h2 style="margin: 0; color: #d9534f;">Appointment Cancelled</h2>
                </div>
                <div style="padding: 20px;">
                    <p>Hi there,</p>
                    <p>This is a notification that the following appointment has been cancelled by <strong>${cancellerName}</strong>:</p>
                    <div style="background: #f9f9f9; border-left: 4px solid #d9534f; padding: 15px; margin: 20px 0; text-decoration: line-through; color: #777;">
                        <p style="margin: 0;"><strong>Title:</strong> ${booking.title}</p>
                        <p style="margin: 5px 0 0;"><strong>Original Time:</strong> ${formatEventDate(booking.startTime)}</p>
                    </div>
                    <p>This event has been removed from the Google Calendar, and you do not need to take any further action.</p>
                </div>
            </div>
        `;
        return { subject, html };
    }
}

