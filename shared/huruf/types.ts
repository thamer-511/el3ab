export type Team = 'green' | 'red';
export type SessionStatus = 'lobby' | 'playing' | 'ended';
export type BuzzStage = 'first' | 'other' | 'final';
export type AttemptNo = 1 | 2;
export type ClientRole = 'main' | 'mobile';

export interface HurufCell {
  id: string;
  letter: string;
  owner: Team | null;
  closed: boolean;
  neighbors: string[];
}

export interface HurufQuestion {
  id: string;
  letter: string;
  prompt: string;
  answer: string;
}

export interface BuzzerState {
  locked: boolean;
  lockedBy: Team | null;
}

export interface HurufSessionState {
  sessionId: string;
  status: SessionStatus;
  board: HurufCell[];
  currentTeamTurn: Team;
  activeCellId: string | null;
  activeQuestion: HurufQuestion | null;
  buzzer: BuzzerState;
  attemptNo: AttemptNo;
  stage: BuzzStage;
  winner: Team | null;
  updatedAt: number;
}

export type HurufClientEvent =
  | { type: 'JOIN'; role: ClientRole; team?: Team }
  | { type: 'BUZZ_REQUEST'; team: Team }
  | { type: 'MAIN_START_GAME' }
  | { type: 'MAIN_SELECT_CELL'; cellId: string }
  | { type: 'MAIN_MARK_CORRECT' }
  | { type: 'MAIN_MARK_WRONG' }
  | { type: 'MAIN_NEW_QUESTION' }
  | { type: 'MAIN_RESET_BUZZER' }
  | { type: 'PING' };

export type HurufServerEvent =
  | { type: 'SESSION_STATE'; state: HurufSessionState }
  | { type: 'BUZZ_LOCKED'; team: Team }
  | { type: 'BUZZ_RESET' }
  | { type: 'QUESTION_CHANGED'; cellId: string; question: HurufQuestion }
  | { type: 'CELL_OWNED'; cellId: string; team: Team }
  | { type: 'GAME_ENDED'; winner: Team }
  | { type: 'ERROR'; message: string };
