const http = require('http');

function makeRequest() {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        http.get('http://localhost:8787/api/v1/admin/public/icebreakers', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const end = Date.now();
                resolve({
                    timeMs: end - start,
                    cacheHeader: res.headers['x-cache'],
                    status: res.statusCode,
                    bodyLength: data.length
                });
            });
        }).on('error', reject);
    });
}

async function runTest() {
    console.log("Waiting 3 seconds for server to start...");
    await new Promise(r => setTimeout(r, 3000));
    
    console.log("--- First Request (Expected MISS) ---");
    const res1 = await makeRequest();
    console.log(res1);
    
    console.log("--- Second Request (Expected HIT) ---");
    const res2 = await makeRequest();
    console.log(res2);
    
    console.log("--- Third Request (Expected HIT) ---");
    const res3 = await makeRequest();
    console.log(res3);
}

runTest().catch(console.error);
