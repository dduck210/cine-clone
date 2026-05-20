const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test utilities
const testEndpoint = async (method, path, data = null, headers = {}) => {
    try {
        const config = {
            method,
            url: `${API_BASE}${path}`,
            headers: { 'Content-Type': 'application/json', ...headers },
        };
        if (data) config.data = data;

        const response = await axios(config);
        console.log(`✓ ${method} ${path} - Status: ${response.status}`);
        return response.data;
    } catch (error) {
        console.error(`✗ ${method} ${path} - Error: ${error.response?.status} ${error.response?.statusText}`);
        console.error(`  Message: ${error.response?.data?.message || error.message}`);
        return null;
    }
};

// Run tests
const runTests = async () => {
    console.log('\n=== CINEMA CLONE API TEST ===\n');

    // 1. Get all movies
    console.log('\n--- Testing Movies ---');
    const moviesRes = await testEndpoint('GET', '/movies');
    if (moviesRes?.data?.length) {
        console.log(`  Found ${moviesRes.data.length} movies`);
    }

    // 2. Get all showtimes
    console.log('\n--- Testing Showtimes ---');
    const showtimesRes = await testEndpoint('GET', '/showtimes');
    if (showtimesRes?.data?.length) {
        console.log(`  Found ${showtimesRes.data.length} showtimes`);
        var showtimeId = showtimesRes.data[0]._id;
        console.log(`  Using showtime ID: ${showtimeId}`);

        // Get showtime details with seats
        const showtimeDetailRes = await testEndpoint('GET', `/showtimes/${showtimeId}`);
        if (showtimeDetailRes?.data?.seats?.length) {
            console.log(`  Showtime has ${showtimeDetailRes.data.seats.length} seats`);
        }
    }

    // 3. Get all cinemas (admin endpoint)
    console.log('\n--- Testing Admin Cinema Endpoints ---');
    const cinemasRes = await testEndpoint('GET', '/admin/cinemas');
    if (cinemasRes?.data?.length) {
        console.log(`  Found ${cinemasRes.data.length} cinemas`);
    }

    // 4. Register test user
    console.log('\n--- Testing Auth ---');
    const registerRes = await testEndpoint('POST', '/auth/register', {
        name: `Test User ${Date.now()}`,
        email: `testuser${Date.now()}@example.com`,
        password: 'Test@123',
    });

    let token = null;
    if (registerRes?.token) {
        token = registerRes.token;
        console.log(`  User registered with token: ${token.substring(0, 20)}...`);
    }

    // 5. Test booking with auth token
    if (token && showtimeId) {
        console.log('\n--- Testing Bookings (Protected) ---');

        // Get available seats first
        const seatsRes = await testEndpoint('GET', `/showtimes/${showtimeId}`, null, {
            'Authorization': `Bearer ${token}`,
        });

        if (seatsRes?.data?.seats?.length > 0) {
            const availableSeats = seatsRes.data.seats.filter(s => s.status === 'available');
            if (availableSeats.length >= 2) {
                const seatIds = [availableSeats[0]._id, availableSeats[1]._id];

                const bookingRes = await testEndpoint('POST', '/bookings', {
                    showtime: showtimeId,
                    seats: seatIds,
                    seatNumbers: [`${availableSeats[0].row}${availableSeats[0].col}`, `${availableSeats[1].row}${availableSeats[1].col}`],
                    totalPrice: seatsRes.data.price * 2,
                }, {
                    'Authorization': `Bearer ${token}`,
                });

                if (bookingRes?.data?._id) {
                    const bookingId = bookingRes.data._id;
                    console.log(`  Booking created: ${bookingId}`);
                    console.log(`  Booking Code: ${bookingRes.data.bookingCode}`);
                    console.log(`  Status: ${bookingRes.data.status}`);

                    // 6. Test payment
                    console.log('\n--- Testing Payments (Protected) ---');
                    const paymentRes = await testEndpoint('POST', '/payments', {
                        booking: bookingId,
                        amount: bookingRes.data.totalPrice,
                        method: 'credit_card',
                    }, {
                        'Authorization': `Bearer ${token}`,
                    });

                    if (paymentRes?.data?._id) {
                        console.log(`  Payment created: ${paymentRes.data._id}`);
                        console.log(`  Transaction ID: ${paymentRes.data.transactionId}`);
                        console.log(`  Status: ${paymentRes.data.status}`);
                    }

                    // 7. Get user bookings
                    const userBookingsRes = await testEndpoint('GET', '/bookings/user/all', null, {
                        'Authorization': `Bearer ${token}`,
                    });
                    if (userBookingsRes?.data?.length) {
                        console.log(`  User has ${userBookingsRes.data.length} bookings`);
                    }
                }
            }
        }
    }

    // 8. Test admin stats endpoints
    console.log('\n--- Testing Admin Stats (Protected) ---');
    if (token) {
        await testEndpoint('GET', '/admin/reports/revenue', null, {
            'Authorization': `Bearer ${token}`,
        });

        await testEndpoint('GET', '/admin/reports/occupancy', null, {
            'Authorization': `Bearer ${token}`,
        });

        await testEndpoint('GET', '/admin/reports/top-movies', null, {
            'Authorization': `Bearer ${token}`,
        });

        await testEndpoint('GET', '/admin/reports/bookings', null, {
            'Authorization': `Bearer ${token}`,
        });
    }

    console.log('\n=== TEST COMPLETE ===\n');
    process.exit(0);
};

runTests().catch(err => {
    console.error('Test failed:', err.message);
    process.exit(1);
});
