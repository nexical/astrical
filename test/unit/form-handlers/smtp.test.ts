/**
 * src/core/test/unit/utils/form-handlers/smtp.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SMTPHandler } from '~/form-handlers/smtp';
import nodemailer from 'nodemailer';

// Mock nodemailer
vi.mock('nodemailer', () => ({
    default: {
        createTransport: vi.fn().mockReturnValue({
            sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' })
        })
    }
}));

// Mock astro:env/server
vi.mock('astro:env/server', () => ({
    getSecret: (key: string) => {
        const secrets = {
            'SMTP_HOST': 'smtp.test.com',
            'SMTP_PORT': '587',
            'SMTP_USER': 'user',
            'SMTP_PASS': 'pass',
            'SMTP_FROM': 'sender@test.com',
            'SMTP_SECURE': 'false'
        };
        return secrets[key];
    }
}));

describe('SMTPHandler', () => {
    let handler: SMTPHandler;
    let mockTransport: unknown;

    beforeEach(async () => {
        vi.clearAllMocks();
        handler = new SMTPHandler();
        mockTransport = nodemailer.createTransport();

        // Reset getSecret to default valid config
        vi.mocked(await import('astro:env/server')).getSecret = vi.fn((key) => {
            const secrets = {
                'SMTP_HOST': 'smtp.test.com',
                'SMTP_PORT': '587',
                'SMTP_USER': 'user',
                'SMTP_PASS': 'pass',
                'SMTP_FROM': 'sender@test.com',
                'SMTP_SECURE': 'false'
            };
            return secrets[key];
        });
    });

    it('should send email with correct parameters', async () => {
        const data = { name: 'Test User', email: 'test@example.com' };
        const attachments = [{ filename: 'test.txt', data: Buffer.from('content') }];
        const config = { recipients: ['admin@example.com'] };

        await handler.handle('contact', data, attachments, config);

        expect(nodemailer.createTransport).toHaveBeenCalledWith({
            host: 'smtp.test.com',
            port: 587,
            secure: false,
            auth: { user: 'user', pass: 'pass' }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((mockTransport as any).sendMail).toHaveBeenCalledWith({
            from: 'sender@test.com',
            to: 'admin@example.com',
            subject: 'New Form Submission: contact',
            text: expect.stringContaining('name: Test User'),
            html: expect.stringContaining('name: Test User'),
            attachments: [{ filename: 'test.txt', content: Buffer.from('content') }]
        });
    });



    it('should use secure connection if configured', async () => {
        vi.mocked(await import('astro:env/server')).getSecret = vi.fn((key) => {
            if (key === 'SMTP_SECURE') return 'true';
            return 'val';
        });

        await handler.handle('contact', {}, [], { recipients: 'a' });

        expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
            secure: true
        }));
    });

    it('should default to non-secure if not configured', async () => {
        vi.mocked(await import('astro:env/server')).getSecret = vi.fn((key) => {
            if (key === 'SMTP_SECURE') return undefined; // only secure is missing
            const secrets = {
                'SMTP_HOST': 'smtp.test.com',
                'SMTP_PORT': '587',
                'SMTP_USER': 'user',
                'SMTP_PASS': 'pass',
                'SMTP_FROM': 'sender@test.com',
            };
            return secrets[key];
        });

        await handler.handle('contact', {}, [], { recipients: 'a' });

        expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
            secure: false
        }));
    });

    it('should handle undefined recipients gracefully', async () => {
        // If config is provided but no recipients, it should log and return (not throw)
        // We'll spy on console.warn
        const consoleSpy = vi.spyOn(console, 'warn');

        await handler.handle('contact', {}, [], {});

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No recipients configured'));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((mockTransport as any).sendMail).not.toHaveBeenCalled();
    });

    it('should throw error if env vars undefined', async () => {
        // We need to override the mock for this test
        vi.mocked(await import('astro:env/server')).getSecret = vi.fn().mockReturnValue(undefined);

        // Re-instantiate needed? No, getSecret is called inside handle()

        await expect(handler.handle('contact', {}, [], { recipients: 'a' }))
            .rejects.toThrow('SMTPHandler: Missing SMTP environment variables');
    });

    it('should catch and rethrow sendMail error', async () => {
        // Mock getSecret to return valid config first (or rely on default mock if we didn't break it irrevocably in previous test)
        // Note: previous test overrode getSecret! We need to restore it. 
        // But tests run in parallel or sequence? beforeEach clearAllMocks cleans usage data but not implementation if overridden directly on the module export unless mockReset was used?
        // vi.mocked(...).getSecret = ... overrides the implementation. 
        // We should restore it. Or better, fix the previous test to spyOn.

        // Let's assume we need to re-mock or restore.
        vi.mocked(await import('astro:env/server')).getSecret = vi.fn(() => 'valid');

        // Force sendMail to fail
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mockTransport as any).sendMail.mockRejectedValue(new Error('SMTP Error'));

        await expect(handler.handle('contact', {}, [], { recipients: 'admin@example.com' }))
            .rejects.toThrow('SMTPHandler failed: SMTP Error');
    });

    it('should handle non-Error objects thrown', async () => {
        vi.mocked(await import('astro:env/server')).getSecret = vi.fn(() => 'valid');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mockTransport as any).sendMail.mockRejectedValue('String Error');

        await expect(handler.handle('contact', {}, [], { recipients: 'admin@example.com' }))
            .rejects.toThrow('SMTPHandler failed: String Error');
    });
});
