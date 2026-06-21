import mongoose from 'mongoose';

export class GracefulShutdownManager {
    private server: any;

    constructor(server: any) {
        this.server = server;
    }

    private async shutdownMongoDB() {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('🔌 MongoDB disconnected');
        }
    }

    private async handleShutdown(signal: string) {
        console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

        try {
            // Close HTTP/HTTPS server
            await new Promise((resolve) => this.server.close(resolve));
            console.log('✅ HTTP server closed');

            // Clean up other resources
            await this.shutdownMongoDB();

            console.log('✅ All services cleaned up. Exiting now.');
            process.exit(0);
        } catch (err) {
            console.error('❌ Error during shutdown:', err);
            process.exit(1);
        }
    }

    initiate() {
        process.on('SIGINT', () => this.handleShutdown('SIGINT'));
        process.on('SIGTERM', () => this.handleShutdown('SIGTERM'));
    }
}
