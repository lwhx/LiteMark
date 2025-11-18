import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  applyCors,
  handleOptions,
  parseJsonBody,
  sendError,
  sendJson
} from '../_lib/http.js';
import { createBookmark, listBookmarks } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';

type ImportBookmark = {
  title: string;
  url: string;
  category?: string;
  description?: string;
  visible?: boolean;
};

type ImportBody = {
  bookmarks?: ImportBookmark[];
};

function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res, 'POST,OPTIONS')) {
    return;
  }
  applyCors(res, 'POST,OPTIONS');

  const auth = requireAuth(req, res);
  if (!auth) {
    return;
  }

  if (req.method !== 'POST') {
    sendError(res, 405, 'Method Not Allowed');
    return;
  }

  try {
    const body = await parseJsonBody<ImportBody>(req);
    const bookmarks = body.bookmarks;

    if (!Array.isArray(bookmarks)) {
      sendError(res, 400, 'bookmarks 必须是数组');
      return;
    }

    const created: any[] = [];
    for (const item of bookmarks) {
      const title = item.title?.trim();
      const url = item.url?.trim();

      if (!title || !url) {
        continue; // 跳过无效项
      }

      try {
        const bookmark = await createBookmark({
          title,
          url: sanitizeUrl(url),
          category: item.category?.trim() || undefined,
          description: item.description?.trim() || undefined,
          visible: item.visible ?? true
        });
        created.push(bookmark);
      } catch (error) {
        console.error('导入书签项失败', error);
      }
    }

    const allBookmarks = await listBookmarks();
    sendJson(res, 200, { imported: created.length, bookmarks: allBookmarks });
  } catch (error) {
    console.error('导入书签失败', error);
    sendError(res, 500, '导入书签失败');
  }
}

