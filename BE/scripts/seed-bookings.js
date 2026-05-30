/**
 * Seed realistic test bookings after TTL index accident wiped data.
 * Run: node scripts/seed-bookings.js
 */
const mongoose = require('mongoose');
require('dotenv').config();
require('dns').setServers(['8.8.8.8', '8.8.4.4']);

const STATUSES = ['paid', 'paid', 'paid', 'paid', 'paid', 'refunded', 'paid', 'paid', 'paid', 'refunded'];
const METHODS = ['momo', 'qr', 'momo', 'qr', 'momo', 'momo', 'qr', 'momo', 'qr', 'momo'];
const SEAT_TYPES = ['normal', 'vip', 'couple'];
const COMBOS = [
    [],
    [{ name: 'Combo Solo', quantity: 1, price: 80000 }],
    [{ name: 'Combo Couple', quantity: 1, price: 150000 }],
    [{ name: 'Combo Solo', quantity: 2, price: 80000 }],
    [],
];

function randomBetween(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function daysAgo(n) { return new Date(Date.now() - n * 24 * 60 * 60 * 1000); }

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const showtimes = await mongoose.connection.collection('showtimes')
        .find({ status: { $in: ['active', 'expired'] } }).toArray();
    const users = await mongoose.connection.collection('users')
        .find({ role: 'user' }).toArray();
    const payments = mongoose.connection.collection('payments');
    const bookings = mongoose.connection.collection('bookings');

    if (!showtimes.length || !users.length) {
        console.log('Not enough data to seed. Need showtimes + users.');
        process.exit(1);
    }

    const bookingDocs = [];
    const paymentDocs = [];

    for (let i = 0; i < 80; i++) {
        const showtime = randomItem(showtimes);
        const user = randomItem(users);
        const status = STATUSES[i % STATUSES.length];
        const method = METHODS[i % METHODS.length];
        const numSeats = randomBetween(1, 3);
        const seatType = randomItem(SEAT_TYPES);
        const seatPrice = seatType === 'vip' ? 135000 : seatType === 'couple' ? 180000 : 90000;
        const extraItems = randomItem(COMBOS);
        const extraTotal = extraItems.reduce((s, c) => s + c.price * c.quantity, 0);
        const totalPrice = seatPrice * numSeats + extraTotal;
        const refunded = status === 'refunded';
        const createdAt = daysAgo(randomBetween(1, 30));
        const paymentId = new mongoose.Types.ObjectId();
        const bookingId = new mongoose.Types.ObjectId();

        const seatNumbers = Array.from({ length: numSeats }, (_, k) =>
            `${String.fromCharCode(65 + randomBetween(0, 7))}${randomBetween(1, 10)}`
        );

        bookingDocs.push({
            _id: bookingId,
            user: user._id,
            showtime: showtime._id,
            seats: [],
            seatNumbers,
            totalPrice,
            status,
            ticketStatus: refunded ? 'not_printed' : (Math.random() > 0.5 ? 'printed' : 'not_printed'),
            paymentId,
            bookingCode: 'BK' + Date.now() + i + randomBetween(0, 999),
            expiresAt: null, // explicitly null — no TTL deletion
            extraItems,
            voucherDiscount: 0,
            refundAmount: refunded ? Math.round(totalPrice * 0.8) : 0,
            refundedAt: refunded ? createdAt : null,
            refundReason: refunded ? 'Khach hang yeu cau hoan ve' : null,
            createdAt,
            updatedAt: createdAt,
        });

        paymentDocs.push({
            _id: paymentId,
            booking: bookingId,
            method,
            amount: totalPrice,
            status: refunded ? 'refunded' : 'success',
            refundAmount: refunded ? Math.round(totalPrice * 0.8) : 0,
            refundDate: refunded ? createdAt : null,
            createdAt,
            updatedAt: createdAt,
        });
    }

    await bookings.insertMany(bookingDocs);
    await payments.insertMany(paymentDocs);

    const paidCount = bookingDocs.filter(b => b.status === 'paid').length;
    const refundCount = bookingDocs.filter(b => b.status === 'refunded').length;
    const revenue = bookingDocs.filter(b => b.status === 'paid').reduce((s, b) => s + b.totalPrice, 0);
    console.log(`Seeded ${bookingDocs.length} bookings: ${paidCount} paid, ${refundCount} refunded`);
    console.log(`Estimated revenue: ${revenue.toLocaleString('vi-VN')}d`);
    process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
