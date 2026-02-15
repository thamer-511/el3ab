import React, { useEffect, useMemo, useState } from 'react';
import type { HurufServerEvent, HurufSessionState, Team } from '../../../../shared/huruf/types';
import { connectHurufSocket, createHurufSession } from '../../lib/huruf';

const stageText: Record<HurufSessionState['stage'], string> = {
  first: 'المحاولة الأولى',
  other: 'الفرصة للفريق الآخر',
  final: 'فرصة نهائية (زر جديد)',
};

export const HurufMain = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [state, setState] = useState<HurufSessionState | null>(null);
  const [send, setSend] = useState<((event: any) => void) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    createHurufSession()
      .then(({ sessionId: id }) => {
        setSessionId(id);
        const socket = connectHurufSocket(id, (event: HurufServerEvent) => {
          if (event.type === 'SESSION_STATE') {
            setState(event.state);
          }
        });
        setSend(() => socket.send);
        socket.ws.onopen = () => socket.send({ type: 'JOIN', role: 'main' });
        cleanup = () => socket.ws.close();
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to create Huruf session:', err);
        setError('فشل في إنشاء جلسة اللعبة. يرجى المحاولة لاحقاً.');
        setLoading(false);
      });

    return () => cleanup?.();
  }, []);

  const joinLinks = useMemo(() => {
    if (!sessionId) return null;
    const base = `${window.location.origin}/games/huruf/join?sessionId=${sessionId}`;
    return {
      green: `${base}&team=green`,
      red: `${base}&team=red`,
    };
  }, [sessionId]);

  const onControl = (type: string) => send?.({ type });
  const selectCell = (cellId: string) => send?.({ type: 'MAIN_SELECT_CELL', cellId });

  // Loading state
  if (loading) {
    return (
      <main className="container mx-auto px-4 py-10">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-[#6A8D56] border-t-transparent"></div>
            <p className="mt-4 font-['Cairo'] text-xl font-bold text-[#5F6A56]">جاري تحميل اللعبة...</p>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="container mx-auto px-4 py-10">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md rounded-2xl border-4 border-red-500 bg-white p-8 text-center shadow-lg">
            <div className="mb-4 text-6xl">⚠️</div>
            <h2 className="font-['Lalezar'] text-3xl text-red-600 mb-4">عذراً!</h2>
            <p className="font-['Cairo'] text-lg text-gray-700 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl border-2 border-[#6A8D56] bg-[#6A8D56] px-8 py-3 font-['Lalezar'] text-xl text-white hover:bg-[#5F7D4E]"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Game interface
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="font-['Lalezar'] text-5xl text-[#6A8D56]">خلية الحروف - الشاشة الرئيسية</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border-4 border-[#2D3436] bg-white p-5 shadow-[6px_6px_0px_#E08C36]">
          <div className="grid grid-cols-6 gap-2">
            {state?.board.map((cell) => {
              const ownerColor = cell.owner === 'green' ? 'bg-[#6A8D56] text-white' : cell.owner === 'red' ? 'bg-[#E08C36] text-white' : 'bg-[#F9FAFB]';
              return (
                <button
                  key={cell.id}
                  disabled={cell.closed || state.status !== 'playing'}
                  onClick={() => selectCell(cell.id)}
                  className={`aspect-square rounded-xl border-2 border-[#2D3436] font-['Lalezar'] text-2xl ${ownerColor} disabled:opacity-70`}
                >
                  {cell.letter}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border-4 border-[#2D3436] bg-white p-5 shadow-[6px_6px_0px_#6A8D56]">
          <p className="font-['Cairo'] font-bold">الحالة: {state?.status ?? 'lobby'}</p>
          <p className="font-['Cairo'] font-bold">الفريق الحالي: {state?.currentTeamTurn === 'green' ? 'الأخضر' : 'الأحمر'}</p>
          <p className="font-['Cairo'] font-bold">قفل الجرس: {state?.buzzer.lockedBy ? (state.buzzer.lockedBy === 'green' ? 'الأخضر' : 'الأحمر') : 'غير مقفول'}</p>
          <p className="font-['Cairo'] font-bold">المحاولة: {state?.attemptNo ?? 1} - {state ? stageText[state.stage] : ''}</p>
          <p className="font-['Cairo'] font-bold">السؤال: {state?.activeQuestion?.prompt ?? 'اختر خلية لبدء السؤال'}</p>

          <div className="grid grid-cols-2 gap-2">
            <ControlButton onClick={() => onControl('MAIN_START_GAME')} label="Start Game" />
            <ControlButton onClick={() => onControl('MAIN_MARK_CORRECT')} label="Mark Correct" />
            <ControlButton onClick={() => onControl('MAIN_MARK_WRONG')} label="Mark Wrong" />
            <ControlButton onClick={() => onControl('MAIN_NEW_QUESTION')} label="New Question" />
            <ControlButton onClick={() => onControl('MAIN_RESET_BUZZER')} label="Reset Buzzer" />
          </div>
        </section>
      </div>

      {joinLinks ? (
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <QrCard team="green" link={joinLinks.green} />
          <QrCard team="red" link={joinLinks.red} />
        </section>
      ) : null}
    </main>
  );
};

const ControlButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button onClick={onClick} className="rounded-lg border-2 border-[#2D3436] bg-[#FDF8E8] px-3 py-2 font-['Lalezar'] text-lg hover:bg-[#E08C36] hover:text-white">
    {label}
  </button>
);

const QrCard = ({ team, link }: { team: Team; link: string }) => (
  <div className="rounded-2xl border-4 border-[#2D3436] bg-white p-4 text-center shadow-[6px_6px_0px_#2D3436]">
    <h3 className="font-['Lalezar'] text-3xl text-[#6A8D56]">فريق {team === 'green' ? 'الأخضر' : 'الأحمر'}</h3>
    <div className="mx-auto mt-3 w-fit bg-white p-2">
      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(link)}`} alt="QR" className="h-[180px] w-[180px]" />
    </div>
    <p className="mt-3 text-sm" dir="ltr">{link}</p>
  </div>
);
