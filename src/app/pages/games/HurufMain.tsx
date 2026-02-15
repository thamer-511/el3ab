import React, { useEffect, useMemo, useState } from 'react';
import type { HurufServerEvent, HurufSessionState, Team } from '../../../../shared/huruf/types';
import { connectHurufSocket, createHurufSession } from '../../lib/huruf';

const stageText: Record<HurufSessionState['stage'], string> = {
  first: 'المحاولة الأولى',
  other: 'الفرصة للفريق الآخر',
  final: 'فرصة نهائية (زر جديد)',
};

const teamName = (team: Team) => (team === 'green' ? 'الأخضر' : 'الأحمر');

export const HurufMain = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [state, setState] = useState<HurufSessionState | null>(null);
  const [send, setSend] = useState<((event: any) => void) | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    createHurufSession().then(({ sessionId: id }) => {
      setSessionId(id);
      const socket = connectHurufSocket(id, (event: HurufServerEvent) => {
        if (event.type === 'SESSION_STATE') {
          setState(event.state);
        }
      });
      setSend(() => socket.send);
      socket.ws.onopen = () => socket.send({ type: 'JOIN', role: 'main' });
      cleanup = () => socket.ws.close();
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

  const canSelectCell = Boolean(state && state.status === 'playing' && !state.activeCellId);
  const hasLockedBuzz = Boolean(state?.buzzer.lockedBy);

  const onControl = (type: string) => send?.({ type });
  const selectCell = (cellId: string) => {
    if (!canSelectCell) return;
    send?.({ type: 'MAIN_SELECT_CELL', cellId });
  };

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="font-['Lalezar'] text-5xl text-[#6A8D56]">خلية الحروف - الشاشة الرئيسية</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border-4 border-[#2D3436] bg-white p-5 shadow-[6px_6px_0px_#E08C36]">
          <div className="mb-3 font-['Cairo'] font-bold text-[#5F6A56]">اختر خلية جديدة فقط عندما لا توجد خلية نشطة.</div>
          <div className="grid grid-cols-6 gap-2">
            {state?.board.map((cell) => {
              const ownerColor = cell.owner === 'green' ? 'bg-[#6A8D56] text-white' : cell.owner === 'red' ? 'bg-[#E08C36] text-white' : 'bg-[#F9FAFB]';
              return (
                <button
                  key={cell.id}
                  disabled={cell.closed || !canSelectCell}
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
          <p className="font-['Cairo'] font-bold">الفريق الحالي: {state?.currentTeamTurn ? teamName(state.currentTeamTurn) : '-'}</p>
          <p className="font-['Cairo'] font-bold">قفل الجرس: {state?.buzzer.lockedBy ? teamName(state.buzzer.lockedBy) : 'غير مقفول'}</p>
          <p className="font-['Cairo'] font-bold">الفرق المسموح لها بالجرس: {state?.allowedBuzzTeams.map(teamName).join(' / ') ?? '-'}</p>
          <p className="font-['Cairo'] font-bold">المحاولة: {state?.attemptNo ?? 1} - {state ? stageText[state.stage] : ''}</p>
          <p className="font-['Cairo'] font-bold">السؤال: {state?.activeQuestion?.prompt ?? 'اختر خلية لبدء السؤال'}</p>

          <div className="grid grid-cols-2 gap-2">
            <ControlButton onClick={() => onControl('MAIN_START_GAME')} label="بدء اللعبة" disabled={state?.status === 'playing'} />
            <ControlButton onClick={() => onControl('MAIN_MARK_CORRECT')} label="إجابة صحيحة" disabled={!hasLockedBuzz} />
            <ControlButton onClick={() => onControl('MAIN_MARK_WRONG')} label="إجابة خاطئة" disabled={!hasLockedBuzz} />
            <ControlButton onClick={() => onControl('MAIN_NEW_QUESTION')} label="سؤال جديد" disabled={!state?.activeCellId} />
            <ControlButton onClick={() => onControl('MAIN_RESET_BUZZER')} label="إعادة ضبط الجرس" disabled={!state?.activeCellId} />
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

const ControlButton = ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="rounded-lg border-2 border-[#2D3436] bg-[#FDF8E8] px-3 py-2 font-['Lalezar'] text-lg hover:bg-[#E08C36] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
  >
    {label}
  </button>
);

const QrCard = ({ team, link }: { team: Team; link: string }) => (
  <div className="rounded-2xl border-4 border-[#2D3436] bg-white p-4 text-center shadow-[6px_6px_0px_#2D3436]">
    <h3 className="font-['Lalezar'] text-3xl text-[#6A8D56]">فريق {teamName(team)}</h3>
    <div className="mx-auto mt-3 w-fit bg-white p-2">
      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(link)}`} alt="QR" className="h-[180px] w-[180px]" />
    </div>
    <p className="mt-3 text-sm" dir="ltr">{link}</p>
  </div>
);
