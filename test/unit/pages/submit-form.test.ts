
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../../src/pages/api/submit-form';
import { formProcessor } from '~/utils/forms';

// Mock utils/forms
vi.mock('~/utils/forms', () => ({
    formProcessor: vi.fn(),
}));

describe('src/pages/api/submit-form', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createRequest = (formData: FormData) => {
        return {
            formData: async () => formData,
        } as unknown as Request;
    };

    it('should return 400 if form-name is missing', async () => {
        const formData = new FormData();
        const response = await POST({ request: createRequest(formData) } as any);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Form name is required');
    });

    it('should process form fields and ignore special fields', async () => {
        const formData = new FormData();
        formData.append('form-name', 'contact');
        formData.append('disclaimer', 'on');
        formData.append('bot-field', '');
        formData.append('contact-name', 'John Doe');
        formData.append('contact-email', 'john@example.com');

        const response = await POST({ request: createRequest(formData) } as any);

        expect(response.status).toBe(200);
        expect(formProcessor).toHaveBeenCalledWith(
            'contact',
            { 'name': 'John Doe', 'email': 'john@example.com' },
            []
        );
    });

    it('should handle multiple array values', async () => {
        const formData = new FormData();
        formData.append('form-name', 'survey');
        formData.append('survey-options', 'A');
        formData.append('survey-options', 'B');
        formData.append('survey-options', 'C');

        const response = await POST({ request: createRequest(formData) } as any);

        expect(response.status).toBe(200);
        expect(formProcessor).toHaveBeenCalledWith(
            'survey',
            { 'options': ['A', 'B', 'C'] },
            []
        );
    });

    it('should handle array values (checkboxes)', async () => {
        const formData = new FormData();
        formData.append('form-name', 'survey');
        formData.append('survey-options', 'A');
        formData.append('survey-options', 'B');

        const response = await POST({ request: createRequest(formData) } as any);

        expect(response.status).toBe(200);
        expect(formProcessor).toHaveBeenCalledWith(
            'survey',
            { 'options': ['A', 'B'] },
            []
        );
    });

    it('should handle file attachments', async () => {
        const formData = new FormData();
        formData.append('form-name', 'upload');

        const file = new File(['content'], 'test.txt', { type: 'text/plain' });
        // Mock arrayBuffer since jsdom File might not fully implement it or specific node version
        file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

        formData.append('upload-file', file);

        const response = await POST({ request: createRequest(formData) } as any);

        expect(response.status).toBe(200);
        expect(formProcessor).toHaveBeenCalledWith(
            'upload',
            { 'file': 'Attached file: test.txt' },
            expect.arrayContaining([
                expect.objectContaining({ filename: 'test.txt' })
            ])
        );
    });

    it('should handle errors gracefully', async () => {
        const formData = new FormData();
        formData.append('form-name', 'error-form');

        (formProcessor as any).mockRejectedValue(new Error('Processing failed'));

        const response = await POST({ request: createRequest(formData) } as any);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe('Processing failed');
    });

    it('should handle unknown errors gracefully', async () => {
        const formData = new FormData();
        formData.append('form-name', 'error-form');

        (formProcessor as any).mockRejectedValue('Unknown string error');

        const response = await POST({ request: createRequest(formData) } as any);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe('Internal server error'); // Fallback
    });
});
