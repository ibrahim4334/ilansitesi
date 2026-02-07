
const http = require('http');

// Helper to make requests
function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ res, body }));
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function login() {
    // 1. Get CSRF Token and Cookies
    const csrfOpts = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/csrf',
        method: 'GET'
    };

    const { res: csrfRes, body: csrfBody } = await request(csrfOpts);
    const json = JSON.parse(csrfBody);
    const csrfToken = json.csrfToken;

    // Extract cookies
    const cookies = csrfRes.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');

    console.log('CSRF Token:', csrfToken);

    // 2. Post Signin
    const postData = new URLSearchParams({
        email: 'ibrahim.erol3443@gmail.com',
        csrfToken: csrfToken,
        callbackUrl: 'http://localhost:3000'
    }).toString();

    const signinOpts = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/signin/nodemailer',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
            'Cookie': cookies
        }
    };

    await request(signinOpts, postData);
    console.log('Login request sent!');
}

login().catch(console.error);
