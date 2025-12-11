/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formProcessor } from '~/utils/forms';

vi.mock('~/utils/mailgun', () => ({
    sendEmail: vi.fn(),
}));
vi.mock('~/utils/loader', () => ({
    getSpecs: vi.fn(),
}));

import { sendEmail } from '~/utils/mailgun';
import { getSpecs } from '~/utils/loader';

describe('src/utils/forms', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should process form and send email', async () => {
        // Mock getSpecs to return form config
        (getSpecs as any).mockReturnValue({
            'contact': { recipients: ['admin@example.com'] }
        });

        const attachments = [{ filename: 'test.txt', data: Buffer.from('content') }];
        await formProcessor('contact', { name: 'John' }, attachments);

        expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
            to: ['admin@example.com'],
            subject: 'New Form Submission: contact',
            text: expect.stringContaining('name: John'),
        }));
    });

    it('should not send email if no recipients configured', async () => {
        (getSpecs as any).mockReturnValue({
            'other': {}
        });

        await formProcessor('other', {}, []);
        expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should throw error if email sending fails', async () => {
        (getSpecs as any).mockReturnValue({
            'contact': { recipients: ['admin@example.com'] }
        });
        (sendEmail as any).mockRejectedValue(new Error('Fail'));

        await expect(formProcessor('contact', {}, [])).rejects.toThrow('There was an error contacting the server');
    });
});
