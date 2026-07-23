const axios = require('axios');

async function test() {
    try {
        const loginRes = await axios.post('http://localhost:8787/api/v1/admin/login', {
            email: 'admin@fastmatch.com',
            password: 'admin123' 
        });
        console.log("Login:", loginRes.data);
        const token = loginRes.data.data.token; // adjust based on response

        const annRes = await axios.post('http://localhost:8787/api/v1/admin/announcements', {
            title: "Test",
            message: "Testing",
            targetAudience: "all"
        }, {
            headers: {
                'x-access-token': 'Bearer ' + token
            }
        });
        console.log("Create Announcement:", annRes.data);
    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}
test();
