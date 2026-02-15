import type { HurufClientEvent, HurufServerEvent } from '../../../shared/huruf/types';

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

  ws.onmessage = (message) => {
    try {
      const event = JSON.parse(String(message.data)) as HurufServerEvent;
      onEvent(event);
    } catch {
      // ignore malformed events
    }
  };

  const send = (event: HurufClientEvent) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  };

  return { ws, send };
};
