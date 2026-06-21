import authService from './auth.services'

class Locator {
    services: Record<string, any>;

    constructor() {
        this.services = {}
    }

    register(name: string, service: any) {
        this.services[name] = service;
    }
    resolve(name: string) {
        if (!this.services[name]) {
            throw new Error(`Service '${name}' not found in the container.`);
        }
        return this.services[name];
    }
}

const serviceLocator = new Locator()

serviceLocator.register('authService', authService)

export default serviceLocator