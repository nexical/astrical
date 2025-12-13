/**
 * src/core/test/unit/utils/form-handlers/smtp.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SMTPHandler } from '~/form-handlers/smtp';

// Mock utils
vi.mock('~/utils/utils', () => ({
    isEdge: vi.fn(),
    isProd: vi.fn(),
    trim: vi.fn((s) => s),
    isObject: vi.fn(),
    mergeDeep: vi.fn(),
    formatter: { format: vi.fn() },
    getFormattedDate: vi.fn(),
    toUiAmount: vi.fn()
}));

// Mock nodemailer
const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });
const mockCreateTransport = vi.fn().mockReturnValue({
    sendMail: mockSendMail
});

vi.mock('nodemailer', () => ({
    createTransport: mockCreateTransport,
    default: {
        createTransport: mockCreateTransport
    }
}));

// Mock worker-mailer
const mockWorkerSend = vi.fn().mockResolvedValue({ id: 'worker-id' });
const mockWorkerConnect = vi.fn().mockResolvedValue({
    send: mockWorkerSend
});

vi.mock('worker-mailer', () => ({
    WorkerMailer: {
        connect: mockWorkerConnect
    }
}));

describe('SMTPHandler', () => {
    let handler: SMTPHandler;

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        handler = new SMTPHandler();

        // Setup default env vars
        process.env.SMTP_HOST = 'smtp.test.com';
        process.env.SMTP_PORT = '587';
        process.env.SMTP_USER = 'user';
        process.env.SMTP_PASS = 'pass';
        process.env.SMTP_FROM = 'sender@test.com';
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete process.env.SMTP_HOST;
        delete process.env.SMTP_PORT;
        delete process.env.SMTP_USER;
        delete process.env.SMTP_PASS;
        delete process.env.SMTP_FROM;
    });

    describe('Node.js Environment', () => {
        beforeEach(async () => {
            const utils = await import('~/utils/utils');
            (utils.isEdge as any).mockReturnValue(false);
        });

        it('should send email using nodemailer via createTransport', async () => {
            const data = { name: 'Test User', email: 'test@example.com' };
            // Use Uint8Array for attachments as per new signature
            const attachments = [{ filename: 'test.txt', data: new Uint8Array([1, 2, 3]) }];
            const config = { recipients: ['admin@example.com'] };

            await handler.handle('contact', data, attachments, config);

            expect(mockCreateTransport).toHaveBeenCalledWith({
                host: 'smtp.test.com',
                port: 587,
                secure: false, // Default
                auth: { user: 'user', pass: 'pass' }
            });

            expect(mockSendMail).toHaveBeenCalledWith({
                from: 'sender@test.com',
                to: 'admin@example.com',
                subject: 'New Submission: contact',
                text: expect.stringContaining('name: Test User'),
                html: expect.stringContaining('name: Test User'),
                attachments: [{ filename: 'test.txt', content: Buffer.from(new Uint8Array([1, 2, 3])) }]
            });
        });

        it('should handle SMTP errors gracefully', async () => {
            mockSendMail.mockRejectedValueOnce(new Error('Auth failed'));

            await expect(handler.handle('contact', {}, [], { recipients: 'admin@example.com' }))
                .rejects.toThrow('Node SMTP Error: Auth failed');
        });
    });

    describe('Edge Environment (Cloudflare)', () => {
        beforeEach(async () => {
            const utils = await import('~/utils/utils');
            (utils.isEdge as any).mockReturnValue(true);
        });

        it('should send email using worker-mailer via connect', async () => {
            const data = { name: 'Edge User' };
            const attachments = [{ filename: 'doc.pdf', data: new Uint8Array([10, 20]) }];
            const config = { recipients: ['edge@example.com'], secure: true };

            await handler.handle('contact', data, attachments, config);

            expect(mockWorkerConnect).toHaveBeenCalledWith({
                transport: {
                    host: 'smtp.test.com',
                    port: 587,
                    secure: true,
                    auth: { user: 'user', pass: 'pass' }
                },
                defaults: {
                    from: { name: 'Website Form', address: 'sender@test.com' }
                }
            });

            expect(mockWorkerSend).toHaveBeenCalledWith({
                to: 'edge@example.com',
                subject: 'New Submission: contact',
                text: expect.stringContaining('name: Edge User'),
                html: expect.stringContaining('name: Edge User'),
                attachments: [{
                    filename: 'doc.pdf',
                    content: new Uint8Array([10, 20]),
                    contentType: 'application/octet-stream'
                }]
            });
        });

        it('should handle WorkerMailer errors', async () => {
            mockWorkerConnect.mockRejectedValueOnce(new Error('Connection timeout'));

            await expect(handler.handle('contact', {}, [], { recipients: 'r' }))
                .rejects.toThrow('Edge SMTP Error: Connection timeout');
        });
    });
});
