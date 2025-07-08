import { fileURLToPath } from 'url';
import path from 'path';
import { pathToFileURL } from 'url';

export async function requireModule(relativePath, metaUrl) {
    const __dirname = path.dirname(fileURLToPath(metaUrl));
    const absolutePath = path.resolve(__dirname, relativePath);
    const fileUrl = pathToFileURL(absolutePath).href;
    return import(fileUrl);
}