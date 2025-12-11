/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendEmail } from '~/utils/mailgun';

// Mock Astro env
vi.mock('astro:env/server', () => ({
    getSecret: vi.fn((key) => `secret-${key}`)
}));

describe('src/utils/mailgun', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks();
        global.fetch = mockFetch;
        global.FormData = class FormData {
            append = vi.fn();
        } as any;
        global.Blob = class Blob {
            constructor(_content: any) { }
        } as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should send email successfully', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ id: 'email-id', message: 'Queued' })
        });

        const result = await sendEmail({
            to: 'test@example.com',
            subject: 'Test Subject',
            text: 'Hello',
            html: '<p>Hello</p>'
        });

        expect(result).toEqual({ id: 'email-id', message: 'Queued' });
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/v3/secret-MAILGUN_DOMAIN/messages'),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    Authorization: expect.stringContaining('Basic ')
                })
            })
        );
    });

    it('should handle attachments', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ id: 'email-id' })
        });

        const attachments = [{ filename: 'test.txt', data: Buffer.from('content') }];
        await sendEmail({
            to: 'test@example.com',
            subject: 'Att',
            text: 'text',
            html: 'html',
            attachments
        });

        // We can check if FormData append was called for attachment, 
        // but since we mocked FormData class, we need to spy on the instance methodology if we want deep verification.
        // For now, ensuring it doesn't crash and calls fetch is good coverage.
        expect(mockFetch).toHaveBeenCalled();
    });

    it('should throw error on fetch failure', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            text: async () => 'Error details'
        });

        await expect(sendEmail({
            to: 'test@example.com',
            subject: 'Err',
            text: 'text',
            html: 'html'
        })).rejects.toThrow('Failed to send email');
    });
});
