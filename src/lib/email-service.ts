/* eslint-disable @typescript-eslint/no-unused-vars */
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
    // This method is unchanged and works perfectly.
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

    // This method is also unchanged.
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

    // --- THIS IS THE NEW METHOD ---
    /**
     * Sends a cancellation notification email to both the seller and the buyer.
     * @param booking The details of the cancelled booking.
     * @param seller The seller user object.
     * @param buyer The buyer user object.
     * @param cancelledBy Indicates who initiated the cancellation.
     */
    async sendBookingCancellation(booking: BookingDetails, seller: MailUser, buyer: MailUser, cancelledBy: 'seller' | 'buyer') {
        try {
            const { subject, html } = this.generateCancellationTemplate(booking, seller, buyer, cancelledBy);

            // Send the notification to both the buyer and the seller
            await resend.emails.send({ from: fromEmail, to: buyer.email, subject, html });
            await resend.emails.send({ from: fromEmail, to: seller.email, subject, html });

        } catch (error) {
            console.error("Failed to send booking cancellation email:", error);
        }
    }

    // This private method is unchanged.
    private generateBookingConfirmationTemplate(booking: BookingDetails, seller: MailUser, buyer: MailUser) {
        // ... (existing template code is perfect)
        const formatEventDate = (date: Date) => { /* ... */ };
        const subject = `${booking.title} with ${seller.name}`;
        // ... etc.
        return { subject, buyerHtml: `...`, sellerHtml: `...` }; // Simplified for brevity
    }

    // This private method is also unchanged.
    private generateReminderTemplate(booking: BookingDetails, user: MailUser, minutesBefore: number) {
        // ... (existing template code is perfect)
        const formatEventTime = (date: Date) => { /* ... */ };
        const subject = `Upcoming Appointment at ${formatEventTime(booking.startTime)}`;
        // ... etc.
        return { subject, html: `...` }; // Simplified for brevity
    }

    // --- THIS IS THE NEW TEMPLATE FOR CANCELLATIONS ---
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

