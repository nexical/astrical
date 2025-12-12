import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MailgunHandler } from '~/form-handlers/mailgun';
import { sendEmail } from '~/utils/mailgun';

vi.mock('~/utils/mailgun', () => ({
    sendEmail: vi.fn()
}));

// Mock Astro env
vi.mock('astro:env/server', () => ({
    getSecret: vi.fn((key) => `secret-${key}`)
}));

describe('MailgunHandler', () => {
    let handler: MailgunHandler;

    beforeEach(() => {
        vi.clearAllMocks();
        handler = new MailgunHandler();
    });

    it('should have correct name and description', () => {
        expect(handler.name).toBe('mailgun');
        expect(handler.description).toBe('Sends form submissions via Mailgun API.');
    });

    it('should warn and exit if no recipients', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        await handler.handle('contact', {}, []);
        expect(consoleSpy).toHaveBeenCalledWith("MailgunHandler: No recipients configured for form 'contact'. Skipping.");
        expect(sendEmail).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('should call sendEmail with correct parameters', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sendEmail as any).mockResolvedValue({ id: '123', message: 'OK' });
        const data = { name: 'John', email: 'john@example.com' };

        await handler.handle('contact', data, [], { recipients: 'admin@example.com' });

        expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
            to: 'admin@example.com',
            subject: 'New Form Submission: contact',
            text: expect.stringContaining('name: John'),
            html: expect.stringContaining('name: John')
        }));
    });

    it('should format array data correctly', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sendEmail as any).mockResolvedValue({ id: '123', message: 'OK' });
        const data = { skills: ['Node', 'Astro'] };

        await handler.handle('contact', data, [], { recipients: 'admin@example.com' });

        expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
            text: expect.stringContaining('skills: Node, Astro'),
        }));
    });

    it('should throw error if sendEmail fails', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sendEmail as any).mockRejectedValue(new Error('API Error'));

        await expect(handler.handle('contact', {}, [], { recipients: 'admin@example.com' }))
            .rejects.toThrow('MailgunHandler failed: API Error');
    });

    it('should handle non-Error objects thrown', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sendEmail as any).mockRejectedValue('Critical Failure');

        await expect(handler.handle('contact', {}, [], { recipients: 'admin@example.com' }))
            .rejects.toThrow('MailgunHandler failed: Critical Failure');
    });
});
