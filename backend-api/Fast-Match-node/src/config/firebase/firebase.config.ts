import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

let firebaseApp: admin.app.App;

try {
    if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(`Service account file not found at ${serviceAccountPath}`);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    console.log('🔥 [Firebase] Attempting to initialize with project:', serviceAccount.project_id);

    const credential = admin.credential.cert(serviceAccount);

    firebaseApp = admin.initializeApp({
        credential,
    });

    // Verify if we can actually get an access token (this catches auth errors early)
    credential.getAccessToken().then((token) => {
        console.log('✅ [Firebase] Access token generated successfully. Auth is working.');
    }).catch((err: any) => {
        console.error('❌ [Firebase] AUTH ERROR: Failed to generate access token.');
        console.error('   → Reason:', err.message);
        console.error('   → Check if your serviceAccountKey.json is valid and not revoked.');
    });

    console.log('🔥 Firebase Admin initialized successfully.');
} catch (error: any) {
    console.error('❌ Firebase Admin initialization failed CRITICALLY:', error.message);
    firebaseApp = admin.initializeApp(); // Fallback
}

export default firebaseApp;
