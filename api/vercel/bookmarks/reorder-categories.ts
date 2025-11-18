import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, handleOptions, parseJsonBody, sendError, sendJson } from '../_lib/http.js';
import { reorderBookmarkCategories } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';

type ReorderCategoriesBody = {
  order?: string[];
};

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
    const body = await parseJsonBody<ReorderCategoriesBody>(req);
    const order = body.order;

    if (!Array.isArray(order)) {
      sendError(res, 400, 'order 必须是数组');
      return;
    }

    const bookmarks = await reorderBookmarkCategories(order);
    sendJson(res, 200, bookmarks);
  } catch (error) {
    console.error('重排序分类失败', error);
    sendError(res, 500, '重排序分类失败');
  }
}

