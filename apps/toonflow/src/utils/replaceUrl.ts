import path from "node:path";

export default function replaceUrl(url: string): string {
    if (typeof url !== 'string' || !url.trim()) return '';
    let cleanedPath = '';
    try {
        const pathname = new URL(url).pathname;
        cleanedPath = pathname.replace(/^\/oss/, '').replace(/^\/smallImage/, '');
    } catch (e) {
        // If not a valid URL, use the original string directly
        cleanedPath = url;
    }

    // Prevent path traversal: normalize path, ensure no upward components
    // Use posix normalization (keep / separator), remove all .. and .
    const normalized = path.posix.normalize(cleanedPath);

    // If normalized path starts with ../ or equals .., path traversal detected, reject
    if (normalized.startsWith('../') || normalized === '..') {
        return '';
    }

    // Remove leading slashes, ensure relative path
    return normalized.replace(/^\/+/, '');
}
