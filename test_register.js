const fetch = require('node-fetch');

async function testRegister() {
    try {
        const username = `testuser_${Date.now()}`;
        console.log(`Attempting to register user: ${username}`);

        const response = await fetch('http://localhost:5000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                username: username,
                password: 'password123'
            })
        });

        const data = await response.json();
        console.log('Status Code:', response.status);
        console.log('Response:', data);

        if (response.status === 201) {
            console.log('✅ Registration SUCCESS via Script');
        } else {
            console.log('❌ Registration FAILED via Script');
        }
    } catch (error) {
        console.error('❌ Script Error:', error);
    }
}

testRegister();
