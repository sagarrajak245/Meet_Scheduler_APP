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
            // In a real app, you might add this to a retry queue
        }
    }

    // We will build the reminder email logic later
    // async sendReminder(...) {}

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

        // Customize the message for buyer and seller
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
}
