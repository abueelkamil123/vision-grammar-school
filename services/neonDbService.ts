export interface NeonCloudState {
  students?: any[];
  attendanceData?: Record<string, any>;
  examRecords?: any[];
  feeRecords?: any[];
  holidays?: any[];
  themeConfig?: any;
}

export async function fetchFromNeonDb(): Promise<{
  connected: boolean;
  data: NeonCloudState;
}> {
  try {
    const res = await fetch('/api/db', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { connected: false, data: {} };
    }
    const json = await res.json();
    return {
      connected: Boolean(json.connected),
      data: (json.data || {}) as NeonCloudState,
    };
  } catch {
    return { connected: false, data: {} };
  }
}

export async function saveKeyToNeonDb(key: keyof NeonCloudState, value: any): Promise<boolean> {
  try {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    return Boolean(json.ok);
  } catch {
    return false;
  }
}
