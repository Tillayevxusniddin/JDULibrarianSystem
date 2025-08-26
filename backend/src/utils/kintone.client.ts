import dotenv from 'dotenv';

dotenv.config();

type KintoneRecord = Record<string, { value?: any }> & { $id?: { value?: string } };

export interface KintoneFetchOptions {
  baseUrl?: string;
  appId?: string | number;
  apiToken?: string;
  limit?: number;
}

export async function fetchAllKintoneRecords(options: KintoneFetchOptions = {}): Promise<KintoneRecord[]> {
  const baseUrl = options.baseUrl || process.env.KINTONE_API_BASE_URL;
  const appId = String(options.appId || process.env.KINTONE_APP_ID || '');
  const apiToken = options.apiToken || process.env.KINTONE_API_TOKEN;
  const limit = options.limit ?? 100;
  const guestSpaceId = process.env.KINTONE_GUEST_SPACE_ID; // optional

  if (!baseUrl || !apiToken || !appId) {
    throw new Error('Missing Kintone configuration. Ensure KINTONE_API_BASE_URL, KINTONE_API_TOKEN, and KINTONE_APP_ID are set.');
  }

  const all: KintoneRecord[] = [];
  let offset = 0;
  let hasMore = true;

  const recordsPath = guestSpaceId
    ? `${baseUrl}/k/guest/${encodeURIComponent(guestSpaceId)}/v1`
    : `${baseUrl}/k/v1`;

  try {
    while (hasMore) {
      const url = `${recordsPath}/records.json?app=${encodeURIComponent(appId)}&query=${encodeURIComponent(
        `limit ${limit} offset ${offset}`,
      )}`;
      const res = await fetch(url, {
        headers: {
          'X-Cybozu-API-Token': apiToken,
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`GET records failed (${res.status}): ${text}`);
      }
      const data = (await res.json()) as { records: KintoneRecord[] };
      const records = data.records || [];
      all.push(...records);
      hasMore = records.length === limit;
      offset += limit;
    }
    return all;
  } catch (err) {
    // Fallback to cursor API for robustness
    const cursorSize = 500;
    const createCursorUrl = `${recordsPath}/records/cursor.json`;
    const resCreate = await fetch(createCursorUrl, {
      method: 'POST',
      headers: {
        'X-Cybozu-API-Token': apiToken,
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ app: Number(appId), size: cursorSize }),
    });
    if (!resCreate.ok) {
      const text = await resCreate.text();
      throw new Error(`Kintone fetch failed (${resCreate.status}): ${text}`);
    }
    const { id: cursorId } = (await resCreate.json()) as { id: string };

    try {
      while (true) {
        const getUrl = `${recordsPath}/records/cursor.json?id=${encodeURIComponent(cursorId)}`;
        const resGet = await fetch(getUrl, {
          headers: {
            'X-Cybozu-API-Token': apiToken,
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
          },
        });
        if (!resGet.ok) {
          const text = await resGet.text();
          throw new Error(`Cursor get failed (${resGet.status}): ${text}`);
        }
        const data = (await resGet.json()) as { records: KintoneRecord[]; next: boolean };
        all.push(...(data.records || []));
        if (!data.next) break;
      }
    } finally {
      // Clean up cursor
      await fetch(createCursorUrl, {
        method: 'DELETE',
        headers: {
          'X-Cybozu-API-Token': apiToken,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: cursorId }),
      }).catch(() => {});
    }
  }
  return all;
}

export function getValue<T = any>(record: KintoneRecord, key: string): T | undefined {
  const field = record?.[key];
  return (field && (field as any).value) as T | undefined;
}
