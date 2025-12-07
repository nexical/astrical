import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';
import yaml from 'js-yaml';

// --- Configuration ---
const DATA_DIR = 'data';

// --- Types ---
interface MediaItem {
    url: string;
    filename: string;
    alt?: string;
    type: 'image' | 'video' | 'audio' | 'document';
}

// --- Helper Functions ---

/**
 * Normalizes a URL to ensure it's valid and removes fragments.
 */
function normalizeUrl(urlStr: string): URL | null {
    try {
        const url = new URL(urlStr);
        url.hash = ''; // Remove fragment
        if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
            url.pathname = url.pathname.slice(0, -1);
        }
        return url;
    } catch {
        return null;
    }
}

/**
 * Determines the local file path for a given URL.
 */
function getFilePath(url: URL, baseDir: string): string {
    const urlPath = url.pathname;
    let filePath = path.join(baseDir, url.hostname, urlPath);

    if (urlPath.endsWith('/') || urlPath === '') {
        filePath = path.join(filePath, 'index.html');
    } else if (!path.extname(urlPath)) {
        filePath += '.html';
    }

    return filePath;
}

/**
 * Extracts links from HTML content using Regex.
 */
function extractLinks(html: string, baseUrl: string): string[] {
    const links: string[] = [];
    const regex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
        const href = match[2];
        try {
            const absoluteUrl = new URL(href, baseUrl).href;
            links.push(absoluteUrl);
        } catch {
            // Ignore invalid URLs
        }
    }
    return links;
}

/**
 * Extracts media assets from HTML content.
 */
function extractMedia(html: string, baseUrl: string): MediaItem[] {
    const mediaItems: MediaItem[] = [];

    // Helper to add item if valid
    const addItem = (urlStr: string, type: MediaItem['type'], alt?: string) => {
        try {
            const absoluteUrl = new URL(urlStr, baseUrl).href;
            const filename = path.basename(new URL(absoluteUrl).pathname) || `file_${Date.now()}`;
            mediaItems.push({ url: absoluteUrl, filename, alt, type });
        } catch {
            // Ignore
        }
    };

    // Images
    const imgRegex = /<img\s+(?:[^>]*?\s+)?src=(["'])(.*?)\1(?:[^>]*?\s+alt=(["'])(.*?)\3)?/gi;
    let match: RegExpExecArray | null;

    while ((match = imgRegex.exec(html)) !== null) {
        addItem(match[2], 'image', match[4]);
    }

    // Video/Audio sources
    const sourceRegex = /<source\s+(?:[^>]*?\s+)?src=(["'])(.*?)\1(?:[^>]*?\s+type=(["'])(.*?)\3)?/gi;
    while ((match = sourceRegex.exec(html)) !== null) {
        const type = match[4]?.includes('audio') ? 'audio' : 'video'; // Simple heuristic
        addItem(match[2], type);
    }

    // Documents (anchors ending in specific extensions)
    const docExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.csv'];
    const docRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi;
    while ((match = docRegex.exec(html)) !== null) {
        const href = match[2];
        if (docExtensions.some(ext => href.toLowerCase().endsWith(ext))) {
            addItem(href, 'document');
        }
    }

    return mediaItems;
}

/**
 * Downloads a file to the specified path.
 */
async function downloadFile(url: string, destPath: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const buffer = await response.arrayBuffer();
        await fs.writeFile(destPath, Buffer.from(buffer));
    } catch (e) {
        console.error(`Failed to download media ${url}: ${(e as Error).message}`);
    }
}

/**
 * Downloads content using Puppeteer.
 */
async function downloadWithPuppeteer(url: string): Promise<string> {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const content = await page.content();
        return content;
    } finally {
        await browser.close();
    }
}

/**
 * Downloads content using standard fetch (Fallback).
 */
async function downloadWithFetch(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Fetch failed with status: ${response.status}`);
    }
    return await response.text();
}

// --- Main Logic ---

async function scrapeWebsite(startUrl: string, maxDepth: number = Infinity) {
    const startUrlObj = normalizeUrl(startUrl);

    if (!startUrlObj) {
        console.error('Invalid start URL');
        process.exit(1);
    }

    const visited = new Set<string>();
    const queue: { url: string; depth: number }[] = [{ url: startUrlObj.href, depth: 0 }];
    const allMedia = new Map<string, MediaItem>(); // Use Map to avoid duplicates by URL

    const allowedDomain = startUrlObj.hostname;
    const websiteDir = path.join(DATA_DIR, allowedDomain);
    const mediaDir = path.join(websiteDir, 'media');

    // Clean up existing data directory
    try {
        console.log(`Cleaning up directory: ${websiteDir}`);
        await fs.rm(websiteDir, { recursive: true, force: true });
        await fs.mkdir(mediaDir, { recursive: true });
    } catch (err) {
        console.error(`Failed to clean/create directory ${websiteDir}: ${(err as Error).message}`);
    }

    while (queue.length > 0) {
        const { url: currentUrlStr, depth } = queue.shift()!;

        if (visited.has(currentUrlStr)) continue;
        visited.add(currentUrlStr);

        if (depth > maxDepth) continue;

        const currentUrl = normalizeUrl(currentUrlStr);
        if (!currentUrl) continue;

        // Check domain constraint (subdomains allowed)
        if (!currentUrl.hostname.endsWith(allowedDomain) && currentUrl.hostname !== allowedDomain) {
            continue;
        }

        console.log(`Scraping: ${currentUrlStr}`);

        let html = '';
        try {
            html = await downloadWithPuppeteer(currentUrlStr);
        } catch (puppeteerError) {
            console.warn(`Puppeteer failed for ${currentUrlStr}, falling back to fetch. Error: ${(puppeteerError as Error).message}`);
            try {
                html = await downloadWithFetch(currentUrlStr);
            } catch (fetchError) {
                console.error(`Failed to download ${currentUrlStr}: ${(fetchError as Error).message}`);
                continue;
            }
        }

        // Save to file
        const filePath = getFilePath(currentUrl, DATA_DIR);
        const dirPath = path.dirname(filePath);

        try {
            await fs.mkdir(dirPath, { recursive: true });
            await fs.writeFile(filePath, html);
        } catch (err) {
            console.error(`Failed to save file ${filePath}: ${(err as Error).message}`);
        }

        // Extract Media
        const media = extractMedia(html, currentUrlStr);
        for (const item of media) {
            if (!allMedia.has(item.url)) {
                allMedia.set(item.url, item);
                // Download immediately or queue? Let's download immediately for simplicity, but async
                const destPath = path.join(mediaDir, item.filename);
                // Handle duplicate filenames
                let finalDestPath = destPath;
                let counter = 1;
                while (await fs.stat(finalDestPath).then(() => true).catch(() => false)) {
                    const ext = path.extname(item.filename);
                    const name = path.basename(item.filename, ext);
                    finalDestPath = path.join(mediaDir, `${name}_${counter}${ext}`);
                    counter++;
                }
                // Update filename in item if changed
                item.filename = path.basename(finalDestPath);

                // Fire and forget download to speed up? Or await? 
                // Await to ensure we don't overload network/filesystem too much
                await downloadFile(item.url, finalDestPath);
            }
        }

        // Extract and enqueue links
        const links = extractLinks(html, currentUrlStr);
        for (const link of links) {
            const normalizedUrlObj = normalizeUrl(link);
            if (!normalizedUrlObj) continue;
            const normalizedLink = normalizedUrlObj.href;

            if (!visited.has(normalizedLink)) {
                queue.push({ url: normalizedLink, depth: depth + 1 });
            }
        }
    }

    // Generate Media Index
    try {
        const mediaList = Array.from(allMedia.values());
        const yamlContent = yaml.dump(mediaList);
        await fs.writeFile(path.join(mediaDir, 'media.yaml'), yamlContent);
        console.log(`Media index created with ${mediaList.length} items.`);
    } catch (err) {
        console.error(`Failed to create media index: ${(err as Error).message}`);
    }
}

// --- CLI Entry Point ---

async function main() {
    const args = process.argv.slice(2);
    let url = '';
    let depth = Infinity;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--depth') {
            depth = parseInt(args[i + 1], 10);
            i++;
        } else if (!url) {
            url = args[i];
        }
    }

    if (!url) {
        console.error('Usage: tsx scripts/parse_website.ts <url> [--depth <number>]');
        process.exit(1);
    }

    console.log(`Starting scrape of ${url} with depth ${depth}...`);
    await scrapeWebsite(url, depth);
    console.log('Scraping complete.');
}

main().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});
