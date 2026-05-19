const Booking = require('../models/Booking');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

// Generate ticket PDF
const generateTicketPDF = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId)
            .populate('user')
            .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie' },
                    { path: 'cinema' },
                    { path: 'room' },
                ],
            })
            .populate('seats');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.status !== 'paid') {
            return res.status(400).json({ message: 'Only paid bookings can generate tickets' });
        }

        // Create PDF document
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="ticket-${booking.bookingCode}.pdf"`);

        doc.pipe(res);

        // Title
        doc.fontSize(24).font('Helvetica-Bold').text('MOVIE TICKET', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).text('Cinema Booking System', { align: 'center' });
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Booking information
        doc.fontSize(12).font('Helvetica-Bold').text('Booking Details:', { underline: true });
        doc.font('Helvetica').fontSize(10);
        doc.text(`Booking Code: ${booking.bookingCode}`);
        doc.text(`Customer: ${booking.user.name}`);
        doc.text(`Email: ${booking.user.email}`);
        doc.text(`Booking Date: ${new Date(booking.createdAt).toLocaleString()}`);
        doc.moveDown();

        // Movie and showtime information
        doc.fontSize(12).font('Helvetica-Bold').text('Movie Information:', { underline: true });
        doc.font('Helvetica').fontSize(10);
        doc.text(`Movie: ${booking.showtime.movie.title}`);
        doc.text(`Cinema: ${booking.showtime.cinema.name}`);
        doc.text(`Room: ${booking.showtime.room.name}`);
        doc.text(`Date: ${new Date(booking.showtime.date).toLocaleDateString()}`);
        doc.text(`Time: ${booking.showtime.startTime}`);
        doc.text(`Duration: ${booking.showtime.movie.duration} minutes`);
        doc.moveDown();

        // Seat information
        doc.fontSize(12).font('Helvetica-Bold').text('Seats:', { underline: true });
        doc.font('Helvetica').fontSize(10);
        doc.text(`Seats: ${booking.seatNumbers.join(', ')}`);
        doc.text(`Total Seats: ${booking.seatNumbers.length}`);
        doc.moveDown();

        // Price information
        doc.fontSize(12).font('Helvetica-Bold').text('Price:', { underline: true });
        doc.font('Helvetica').fontSize(10);
        doc.text(`Total Price: $${booking.totalPrice.toFixed(2)}`);
        doc.moveDown();

        // Generate QR code
        const qrCodeDataURL = await QRCode.toDataURL(booking.bookingCode);
        const qrCodeBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');

        doc.fontSize(12).font('Helvetica-Bold').text('QR Code:', { underline: true });
        doc.image(qrCodeBuffer, 200, doc.y, { width: 150 });
        doc.moveDown(8);

        // Important notes
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
        doc.fontSize(10).font('Helvetica-Bold').text('Important Notes:');
        doc.font('Helvetica').fontSize(9);
        doc.text('• Please arrive 15 minutes before the showtime');
        doc.text('• Show this ticket at the entrance');
        doc.text('• No refunds or exchanges after purchase');
        doc.text('• Keep your QR code safe and secure');

        doc.end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Send ticket via email
const sendTicketViaEmail = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId)
            .populate('user')
            .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie' },
                    { path: 'cinema' },
                ],
            });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Generate email body
        const emailBody = `
      <h2>Your Movie Ticket</h2>
      <p>Hi ${booking.user.name},</p>
      <p>Your booking has been confirmed. Here are your ticket details:</p>
      
      <h3>Booking Information</h3>
      <p><strong>Booking Code:</strong> ${booking.bookingCode}</p>
      <p><strong>Movie:</strong> ${booking.showtime.movie.title}</p>
      <p><strong>Cinema:</strong> ${booking.showtime.cinema.name}</p>
      <p><strong>Date:</strong> ${new Date(booking.showtime.date).toLocaleDateString()}</p>
      <p><strong>Time:</strong> ${booking.showtime.startTime}</p>
      <p><strong>Seats:</strong> ${booking.seatNumbers.join(', ')}</p>
      <p><strong>Total Price:</strong> $${booking.totalPrice.toFixed(2)}</p>
      
      <p>Please download your ticket from the link below or visit your account to view your tickets.</p>
      <p>Thank you for booking with us!</p>
    `;

        // In real app, integrate with email service like Nodemailer
        // For now, just return success
        res.json({
            message: 'Email sent successfully',
            emailBody,
            recipient: booking.user.email,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { generateTicketPDF, sendTicketViaEmail };