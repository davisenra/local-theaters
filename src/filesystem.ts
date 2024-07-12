import fs from "node:fs/promises";
import os from "node:os";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

export async function useHtmlCache(key: string, fallback: () => Promise<string>): Promise<string> {
  const cacheKey = os.tmpdir() + `/${key}.html`;
  const isCached = await fileExists(cacheKey);

  if (isCached) {
    const stats = await fs.stat(cacheKey);
    const cacheAge = Date.now() - stats.mtimeMs;

    if (cacheAge < 3600000) {
      // less than one hour
      return await fs.readFile(cacheKey, "utf-8");
    }
  }

  const html = await fallback();

  await fs.writeFile(cacheKey, html);

  return html;
}
