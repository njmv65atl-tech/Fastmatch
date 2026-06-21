import userConstant from './user'
import adminConstant from './admin'
import authConstant from './auth'
import matchConstant from './match'

export const constants = {
    maxRequest: 'Too many requests',
    notFound: 'Invalid API endpoint. Please verify the URL for the Fast-Match project and try again.',
    validData: 'Please enter valid data',
    userOnline: 'User online',
    userOffline: 'User offline',

    //codes
    successCode: 200,
    errorCode: 400,
    unauthorized: 401,
    diffDevice: 402,
    forbidden: 403,
    unavailable: 451,

    DBSetup: (status: boolean) => `DB setup ${status ? 'done' : 'error'}`,
}

export const deviceTypes = {
    ios: 'ios',
    android: 'android',
    web: 'web'
}

export const approveStatus = {
    accepted: 'accepted',
    rejected: 'rejected',
    pending: 'pending'
}

export { userConstant, adminConstant, authConstant, matchConstant }
