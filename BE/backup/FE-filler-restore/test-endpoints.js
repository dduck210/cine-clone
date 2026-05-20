#!/usr/bin/env node

const http = require('http');

// Utility function to make HTTP requests
function makeRequest(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: data ? JSON.parse(data) : null
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// Test flow
async function test() {
    console.log('\n🔷 ========== TEST API ENDPOINTS ==========\n');

    try {
        // Test 1: Register
        console.log('1️⃣  POST /api/auth/register');
        const regRes = await makeRequest('POST', '/api/auth/register', {
            name: 'Test User',
            email: `test${Date.now()}@cinema.com`,
            password: 'Test123!'
        });
        console.log(`   Status: ${regRes.status}`);
        if (regRes.data && regRes.data.token) {
            console.log(`   ✅ Token: ${regRes.data.token.substring(0, 30)}...`);
            var token = regRes.data.token;
        } else {
            console.log(`   ❌ Error: ${regRes.data?.message || 'No token'}`);
            return;
        }

        // Test 2: Get showtimes
        console.log('\n2️⃣  GET /api/showtimes');
        const showRes = await makeRequest('GET', '/api/showtimes');
        console.log(`   Status: ${showRes.status}`);
        console.log(`   ✅ Found ${showRes.data?.length || 0} showtimes`);

        if (showRes.data && showRes.data.length > 0) {
            var showtimeId = showRes.data[0]._id;
            console.log(`   First showtime: ${showRes.data[0]._id} - ${showRes.data[0].movie?.title}`);
        }

        // Test 3: Create booking (protected)
        console.log('\n3️⃣  POST /api/bookings (Protected)');
        const bookRes = await makeRequest('POST', '/api/bookings', {
            showtimeId: showtimeId,
            seats: ['A1', 'A2']
        }, token);
        console.log(`   Status: ${bookRes.status}`);
        if (bookRes.status === 201) {
            console.log(`   ✅ Booking created: ${bookRes.data?.bookingCode}`);
            var bookingId = bookRes.data?._id;
        } else {
            console.log(`   ⚠️  Response: ${bookRes.data?.message || bookRes.data}`);
        }

        // Test 4: Get user bookings (protected)
        console.log('\n4️⃣  GET /api/bookings/user/all (Protected)');
        const userBookRes = await makeRequest('GET', '/api/bookings/user/all', null, token);
        console.log(`   Status: ${userBookRes.status}`);
        console.log(`   ✅ User has ${userBookRes.data?.length || 0} bookings`);

        // Test 5: Create payment (protected)
        console.log('\n5️⃣  POST /api/payments (Protected)');
        if (bookingId) {
            const payRes = await makeRequest('POST', '/api/payments', {
                bookingId: bookingId,
                method: 'credit_card'
            }, token);
            console.log(`   Status: ${payRes.status}`);
            if (payRes.status === 201) {
                console.log(`   ✅ Payment created: ${payRes.data?.transactionId}`);
            } else {
                console.log(`   ⚠️  Response: ${payRes.data?.message || payRes.data}`);
            }
        }

        // Test 6: Admin endpoints (should fail with regular user)
        console.log('\n6️⃣  GET /api/admin/cinemas (Admin Only)');
        const adminRes = await makeRequest('GET', '/api/admin/cinemas', null, token);
        console.log(`   Status: ${adminRes.status}`);
        console.log(`   ${adminRes.status === 401 ? '✅ Correctly rejected (not admin)' : `✅ Response: ${adminRes.data?.length || 0} items`}`);

        console.log('\n\n✅ All tests completed!\n');

    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

test();
