import type { HurufClientEvent, HurufServerEvent } from '../../../shared/huruf/types';

export type HurufSendResult = 'sent' | 'queued' | 'dropped';

export const createHurufSession = async (): Promise<{ sessionId: string }> => {
  const response = await fetch('/api/huruf/session/create', { method: 'POST' });
  if (!response.ok) {
    throw new Error('Failed to create Huruf session');
  }
  return response.json();
};

export const connectHurufSocket = (sessionId: string, onEvent: (event: HurufServerEvent) => void) => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${protocol}://${window.location.host}/api/huruf/session/${sessionId}/ws`);
  const pendingEvents: HurufClientEvent[] = [];

  const flushPending = () => {
    while (ws.readyState === WebSocket.OPEN && pendingEvents.length > 0) {
      const next = pendingEvents.shift();
      if (!next) break;
      ws.send(JSON.stringify(next));
    }
  };

  ws.onmessage = (message) => {
    try {
      const event = JSON.parse(String(message.data)) as HurufServerEvent;
      onEvent(event);
    } catch {
      // ignore malformed events
    }
  };

  ws.addEventListener('open', flushPending);

  const send = (event: HurufClientEvent): HurufSendResult => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
      return 'sent';
    }

    if (ws.readyState === WebSocket.CONNECTING) {
      pendingEvents.push(event);
      return 'queued';
    }

    return 'dropped';
  };

  return { ws, send };
};
