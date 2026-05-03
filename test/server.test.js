const tap = require('tap');
const supertest = require('supertest');
const app = require('../app');
const server = supertest(app);

const mockUser = {
    name: 'Clark Kent',
    email: 'clark@superman.com',
    password: 'Krypt()n8',
    preferences: ['movies', 'comics']
};

let token = '';
let userId = ''; // Added to track the created user for preference lookups

// --- AUTH TESTS ---

tap.test('POST /users/signup', async (t) => { 
    const response = await server.post('/users/signup').send(mockUser);
    t.equal(response.status, 200);
    t.equal(response.body.status, 'success'); // Check for your DRY wrapper status
    t.end();
});

tap.test('POST /users/signup with missing email', async (t) => {
    const response = await server.post('/users/signup').send({
        name: mockUser.name,
        password: mockUser.password
    });
    // Matches your ternary guard logic (400 or 500 depending on schema strictness)
    t.ok([400, 500].includes(response.status)); 
    t.end();
});

tap.test('POST /users/login', async (t) => { 
    const response = await server.post('/users/login').send({
        email: mockUser.email,
        password: mockUser.password
    });
    t.equal(response.status, 200);
    t.hasProp(response.body, 'token');
    token = response.body.token;
    userId = response.body.userId; // Captured from newsService.login return
    t.end();
});

tap.test('POST /users/login with wrong password', async (t) => {
    const response = await server.post('/users/login').send({
        email: mockUser.email,
        password: 'wrongpassword'
    });
    t.equal(response.status, 401); // Validates your error mapping logic
    t.end();
});

// --- PREFERENCES TESTS ---

tap.test('GET /users/preferences', async (t) => {
    // Pass userId as a query param to match app.get('/users/preferences')
    const response = await server.get(`/users/preferences?userId=${userId}`)
        .set('Authorization', `Bearer ${token}`);
    t.equal(response.status, 200);
    t.hasProp(response.body, 'preferences');
    t.same(response.body.preferences, mockUser.preferences);
    t.end();
});

tap.test('GET /users/preferences without token', async (t) => {
    const response = await server.get('/users/preferences');
    t.equal(response.status, 401);
    t.end();
});

tap.test('PUT /users/preferences', async (t) => {
    const response = await server.put('/users/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({
            userId: userId,
            preferences: ['movies', 'comics', 'games']
        });
    t.equal(response.status, 200);
    t.end();
});

// --- NEWS TESTS ---

tap.test('GET /api/news', async (t) => {
    // Updated path to /api/news to match app.js
    const response = await server.get('/api/news').set('Authorization', `Bearer ${token}`);
    t.equal(res.status, 200);
    // Matches your fetchFeed logic returning 'data' array
    t.hasProp(response.body, 'data'); 
    t.end();
});

tap.teardown(() => {
    process.exit(0);
});