const requiredParams = [
    'PORT',
    'MONGO_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
]
const missingParams: Array<string> = requiredParams.filter(params => !process.env[params]);
if (missingParams.length > 0) {
    console.error('Following params are missing in environment file:', missingParams.join(', '))
    process.exit()
}