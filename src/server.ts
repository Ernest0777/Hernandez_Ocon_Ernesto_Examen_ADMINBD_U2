import 'dotenv/config';
import { AppDataSource } from './data-source.js';
import app from './app.js';

async function main() {
    await AppDataSource.initialize();
    const server = app.listen(Number(process.env.PORT || 3001), '127.0.0.1', () => {
        console.log(`API y MySQL conectados: http://localhost:${process.env.PORT || 3001}`);
    });
    server.on('error', async (error) => {
        console.error('No se pudo iniciar el servidor:', error);
        await AppDataSource.destroy();
        process.exitCode = 1;
    });
    for (const signal of ['SIGINT', 'SIGTERM'] as const) {
        process.once(signal, () => {
            server.close(async () => {
                await AppDataSource.destroy();
                process.exit(0);
            });
        });
    }
}
main().catch((error: unknown) => {
    console.error('No se pudo conectar con MySQL:', error);
    process.exitCode = 1;
});

