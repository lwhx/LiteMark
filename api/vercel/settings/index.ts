import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  applyCors,
  handleOptions,
  parseJsonBody,
  sendError,
  sendJson
} from '../_lib/http.js';
import { getSettings, updateSettings } from '../_lib/db.js';
import { requireAuth } from '../_lib/auth.js';

type SettingsBody = {
  theme?: string;
  siteTitle?: string;
  siteIcon?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res, 'GET,PUT,OPTIONS')) {
    return;
  }
  applyCors(res, 'GET,PUT,OPTIONS');

  if (req.method === 'GET') {
    try {
      const settings = await getSettings();
      sendJson(res, 200, settings);
    } catch (error) {
      console.error('获取设置失败', error);
      sendError(res, 500, '获取设置失败');
    }
    return;
  }

  if (req.method === 'PUT') {
    const auth = requireAuth(req, res);
    if (!auth) {
      return;
    }
    try {
      const body = await parseJsonBody<SettingsBody>(req);
      const updated = await updateSettings(body);
      sendJson(res, 200, updated);
    } catch (error) {
      console.error('更新设置失败', error);
      const message = error instanceof Error ? error.message : '更新设置失败';
      sendError(res, 400, message);
    }
    return;
  }

  sendError(res, 405, 'Method Not Allowed');
}

