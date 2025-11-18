import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  applyCors,
  handleOptions,
  parseJsonBody,
  sendError,
  sendJson
} from '../_lib/http.js';
import { createBookmark, listBookmarks, deleteBookmark } from '../_lib/db.js';
import { updateSettings } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';

type BackupData = {
  version?: string;
  bookmarks?: Array<{
    title: string;
    url: string;
    category?: string;
    description?: string;
    visible?: boolean;
  }>;
  settings?: {
    theme?: string;
    siteTitle?: string;
    siteIcon?: string;
  };
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
    const body = await parseJsonBody<BackupData>(req);
    
    // 清空现有数据（可选，根据需求决定）
    // 这里我们选择合并数据，而不是完全替换
    
    // 导入书签
    let importedCount = 0;
    if (Array.isArray(body.bookmarks)) {
      for (const item of body.bookmarks) {
        const title = item.title?.trim();
        const url = item.url?.trim();

        if (!title || !url) {
          continue;
        }

        try {
          await createBookmark({
            title,
            url: sanitizeUrl(url),
            category: item.category?.trim() || undefined,
            description: item.description?.trim() || undefined,
            visible: item.visible ?? true
          });
          importedCount++;
        } catch (error) {
          console.error('导入书签项失败', error);
        }
      }
    }

    // 导入设置
    if (body.settings) {
      try {
        await updateSettings(body.settings);
      } catch (error) {
        console.error('导入设置失败', error);
      }
    }

    const allBookmarks = await listBookmarks();
    sendJson(res, 200, { 
      imported: importedCount,
      bookmarks: allBookmarks 
    });
  } catch (error) {
    console.error('导入备份失败', error);
    sendError(res, 500, '导入备份失败');
  }
}

