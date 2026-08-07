import CircuitBreaker from 'opossum';

export const createCircuitBreaker = (action: (...args: any[]) => Promise<any>, options: any = {}) => {
    const defaultOptions = {
        timeout: 5000, // If the external service takes longer than 5 seconds, trigger a failure
        errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
        resetTimeout: 15000, // After 15 seconds, try again
        capacity: 100, // Limit concurrent requests to 100
    };

    const mergedOptions = { ...defaultOptions, ...options };
    const breaker = new CircuitBreaker(action, mergedOptions);

    breaker.on('open', () => console.warn(`[CircuitBreaker] ⚠️ Circuit opened for ${action.name || 'action'}`));
    breaker.on('halfOpen', () => console.warn(`[CircuitBreaker] ⏳ Circuit half-open for ${action.name || 'action'}`));
    breaker.on('close', () => console.log(`[CircuitBreaker] ✅ Circuit closed for ${action.name || 'action'}`));

    return breaker;
};
