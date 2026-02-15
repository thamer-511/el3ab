import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { HurufServerEvent, Team } from '../../../../shared/huruf/types';
import { connectHurufSocket } from '../../lib/huruf';

type ViewState = 'READY' | 'YOU_BUZZED' | 'OTHER_TEAM_BUZZED' | 'LOCKED' | 'DISCONNECTED';

export const HurufJoin = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') ?? '';
  const team = (searchParams.get('team') as Team) || 'green';
  const [status, setStatus] = useState<ViewState>('DISCONNECTED');
  const sendRef = useRef<((event: any) => void) | null>(null);

  const connect = () => {
    if (!sessionId) return;
    const socket = connectHurufSocket(sessionId, (event: HurufServerEvent) => {
      if (event.type === 'SESSION_STATE') {
        if (!event.state.buzzer.locked) setStatus('READY');
        else if (event.state.buzzer.lockedBy === team) setStatus('YOU_BUZZED');
        else setStatus('OTHER_TEAM_BUZZED');
      }
      if (event.type === 'BUZZ_LOCKED') {
        setStatus(event.team === team ? 'YOU_BUZZED' : 'OTHER_TEAM_BUZZED');
      }
      if (event.type === 'BUZZ_RESET') setStatus('READY');
    });

    sendRef.current = socket.send;
    socket.ws.onopen = () => {
      setStatus('READY');
      socket.send({ type: 'JOIN', role: 'mobile', team });
    };
    socket.ws.onclose = () => {
      setStatus('DISCONNECTED');
      setTimeout(connect, 1000);
    };
  };

  useEffect(() => {
    connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, team]);

  const canBuzz = useMemo(() => status === 'READY', [status]);

  return (
    <main className="container mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-10 text-center">
      <h1 className="font-['Lalezar'] text-5xl text-[#6A8D56]">جرس {team === 'green' ? 'الفريق الأخضر' : 'الفريق الأحمر'}</h1>
      <p className="mt-4 font-['Cairo'] font-bold">الحالة: {status}</p>
      <button
        disabled={!canBuzz}
        onClick={() => sendRef.current?.({ type: 'BUZZ_REQUEST', team })}
        className="mt-8 h-56 w-56 rounded-full border-8 border-[#2D3436] bg-[#E08C36] font-['Lalezar'] text-5xl text-white shadow-[8px_8px_0px_#2D3436] disabled:opacity-60"
      >
        BUZZ
      </button>
      {status === 'DISCONNECTED' ? <p className="mt-4">جاري إعادة الاتصال...</p> : null}
    </main>
  );
};
