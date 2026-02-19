import type {
  BuzzStage,
  HurufCell,
  HurufClientEvent,
  HurufQuestion,
  HurufServerEvent,
  HurufSessionState,
  Team,
} from '../../shared/huruf/types';
import questionBank from '../../shared/huruf/questions.ar.json';

type SocketMeta = { role: 'main' | 'mobile'; team?: Team };

const GRID_SIZE = 6;
const TIMER_DURATION_MS = 10000; // 10 seconds

// Letters that have questions
const ALL_LETTERS = Object.keys(questionBank as Record<string, HurufQuestion[]>);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class HurufSessionDO {
  private readonly sockets = new Map<WebSocket, SocketMeta>();
  private state: HurufSessionState;
  private readonly usedQuestionsByCell = new Map<string, string[]>();
  private timerHandle: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly stateStore: DurableObjectState) {
    this.state = this.buildInitialState();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.endsWith('/init') && request.method === 'POST') {
      await this.restoreOrInit();
      return new Response(JSON.stringify({ ok: true, sessionId: this.state.sessionId }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    if (request.headers.get('Upgrade') === 'websocket') {
      await this.restoreOrInit();
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.acceptSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('Not found', { status: 404 });
  }

  private buildInitialState(sessionId = this.stateStore.id.toString()): HurufSessionState {
    const board = this.createBoard();
    return {
      sessionId,
      status: 'lobby',
      board,
      currentTeamTurn: 'green',
      activeCellId: null,
      activeQuestion: null,
      buzzer: { locked: false, lockedBy: null, timerStart: null },
      attemptNo: 1,
      stage: 'first',
      winner: null,
      matchWins: { green: 0, red: 0 },
      updatedAt: Date.now(),
    };
  }

  private async restoreOrInit() {
    const saved = await this.stateStore.storage.get<HurufSessionState>('session_state');
    if (saved) {
      this.state = saved;
      return;
    }
    this.state = this.buildInitialState();
    await this.persistState();
  }

  private acceptSocket(socket: WebSocket) {
    socket.accept();
    this.sockets.set(socket, { role: 'main' });
    socket.send(JSON.stringify({ type: 'SESSION_STATE', state: this.state } satisfies HurufServerEvent));

    socket.addEventListener('message', async (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as HurufClientEvent;
        await this.handleEvent(socket, payload);
      } catch {
        socket.send(
          JSON.stringify({ type: 'ERROR', message: 'Malformed event payload' } satisfies HurufServerEvent)
        );
      }
    });

    socket.addEventListener('close', () => {
      this.sockets.delete(socket);
    });
  }

  private async handleEvent(socket: WebSocket, event: HurufClientEvent) {
    switch (event.type) {
      case 'JOIN':
        this.handleJoin(socket, event);
        return;
      case 'BUZZ_REQUEST':
        await this.handleBuzzRequest(event.team);
        return;
      case 'MAIN_START_GAME':
        await this.startGame();
        return;
      case 'MAIN_SELECT_CELL':
        await this.selectCell(event.cellId);
        return;
      case 'MAIN_MARK_WRONG':
        await this.markWrong();
        return;
      case 'MAIN_MARK_CORRECT':
        await this.markCorrect();
        return;
      case 'MAIN_RESET_BUZZER':
        await this.resetBuzzer();
        return;
      case 'MAIN_NEW_QUESTION':
        await this.newQuestion();
        return;
      case 'TIMER_EXPIRED':
        await this.handleTimerExpired(event.team);
        return;
      case 'PING':
        socket.send(JSON.stringify({ type: 'SESSION_STATE', state: this.state } satisfies HurufServerEvent));
        return;
      default:
        return;
    }
  }

  private handleJoin(socket: WebSocket, event: Extract<HurufClientEvent, { type: 'JOIN' }>) {
    if (event.role === 'mobile' && event.team) {
      for (const [peer, meta] of this.sockets.entries()) {
        if (peer !== socket && meta.role === 'mobile' && meta.team === event.team) {
          peer.send(
            JSON.stringify({
              type: 'ERROR',
              message: 'تم استبدال هذا الجهاز بجهاز آخر لنفس الفريق.',
            } satisfies HurufServerEvent)
          );
          peer.close(4001, 'Replaced by newer device');
          this.sockets.delete(peer);
        }
      }
    }
    this.sockets.set(socket, { role: event.role, team: event.team });
    socket.send(JSON.stringify({ type: 'SESSION_STATE', state: this.state } satisfies HurufServerEvent));
  }

  private async startGame() {
    this.clearTimer();
    this.usedQuestionsByCell.clear();

    // Rebuild full round state so no owned/closed cell data can leak from previous round.
    const freshState = this.buildInitialState(this.state.sessionId);
    freshState.matchWins = this.state.matchWins;
    const randomCell = freshState.board[Math.floor(Math.random() * freshState.board.length)] ?? null;

    freshState.status = 'playing';
    freshState.currentTeamTurn = 'green';
    freshState.activeCellId = randomCell ? randomCell.id : null;
    freshState.activeQuestion = randomCell ? this.pickQuestionFromBoard(freshState.board, randomCell.id) : null;
    freshState.updatedAt = Date.now();

    this.state = freshState;
    await this.persistState();
    this.broadcastState();
  }

  private async selectCell(cellId: string) {
    if (this.state.status !== 'playing') return;
    const cell = this.state.board.find((c) => c.id === cellId);
    if (!cell || cell.closed) return;
    // Once a cell is selected, prevent changing to another
    if (this.state.activeCellId && this.state.activeCellId !== cellId) return;

    this.state.activeCellId = cellId;
    this.state.attemptNo = 1;
    this.state.stage = 'first';
    this.state.buzzer = { locked: false, lockedBy: null, timerStart: null };

    const question = this.pickQuestion(cellId);
    if (question) {
      this.state.activeQuestion = question;
      this.broadcast({ type: 'QUESTION_CHANGED', cellId, question });
    }

    this.state.updatedAt = Date.now();
    await this.persistState();
    this.broadcastState();
  }

  private async newQuestion() {
    if (!this.state.activeCellId) return;
    const question = this.pickQuestion(this.state.activeCellId);
    if (!question) return;

    this.state.activeQuestion = question;
    this.state.buzzer = { locked: false, lockedBy: null, timerStart: null };
    this.state.updatedAt = Date.now();
    await this.persistState();
    this.broadcast({
      type: 'QUESTION_CHANGED',
      cellId: this.state.activeCellId,
      question,
    });
    this.broadcastState();
  }

  private async resetBuzzer() {
    this.clearTimer();
    this.state.buzzer = { locked: false, lockedBy: null, timerStart: null };
    this.state.updatedAt = Date.now();
    await this.persistState();
    this.broadcast({ type: 'BUZZ_RESET' });
    this.broadcastState();
  }

  private async handleBuzzRequest(team: Team) {
    if (this.state.status !== 'playing') return;
    if (this.state.buzzer.locked) return;

    const now = Date.now();
    this.state.buzzer = { locked: true, lockedBy: team, timerStart: now };
    this.state.updatedAt = now;
    await this.persistState();
    this.broadcast({ type: 'BUZZ_LOCKED', team });
    this.broadcast({ type: 'TIMER_START', team, durationMs: TIMER_DURATION_MS });
    this.broadcastState();

    // Server-side timer as backup
    this.clearTimer();
    this.timerHandle = setTimeout(async () => {
      await this.handleTimerExpired(team);
    }, TIMER_DURATION_MS + 500);
  }

  private async handleTimerExpired(team: Team) {
    if (!this.state.buzzer.locked || this.state.buzzer.lockedBy !== team) return;

    this.clearTimer();

    if (this.state.stage === 'first') {
      // Give chance to the other team
      const otherTeam: Team = team === 'green' ? 'red' : 'green';
      this.state.stage = 'other';
      this.state.buzzer = { locked: false, lockedBy: null, timerStart: null };
      this.state.updatedAt = Date.now();
      await this.persistState();
      this.broadcast({ type: 'TIMER_EXPIRED_SERVER', nextTeam: otherTeam });
      this.broadcastState();
    } else {
      // second team also failed - move to next turn
      this.state.stage = 'first';
      this.state.activeCellId = null;
      this.state.activeQuestion = null;
      this.state.buzzer = { locked: false, lockedBy: null, timerStart: null };
      // Switch turn
      this.state.currentTeamTurn = team === 'green' ? 'red' : 'green';
      this.state.updatedAt = Date.now();
      await this.persistState();
      this.broadcast({ type: 'TIMER_EXPIRED_SERVER', nextTeam: null });
      this.broadcastState();
    }
  }

  private async markWrong() {
    if (!this.state.activeCellId) return;
    this.clearTimer();

    if (this.state.stage === 'first') {
      const otherTeam: Team = this.state.buzzer.lockedBy === 'green' ? 'red' : 'green';
      this.state.stage = 'other';
      this.state.buzzer = { locked: false, lockedBy: null, timerStart: null };
    } else {
      // Both teams failed - next turn
      this.state.stage = 'first';
      this.state.activeCellId = null;
      this.state.activeQuestion = null;
      this.state.buzzer = { locked: false, lockedBy: null, timerStart: null };
      this.state.currentTeamTurn = this.state.currentTeamTurn === 'green' ? 'red' : 'green';
    }

    this.state.updatedAt = Date.now();
    await this.persistState();
    this.broadcastState();
  }

  private async markCorrect() {
    const team = this.state.buzzer.lockedBy;
    const activeCellId = this.state.activeCellId;
    if (!team || !activeCellId) return;

    this.clearTimer();

    const cell = this.state.board.find((item) => item.id === activeCellId);
    if (!cell || cell.closed) return;

    cell.owner = team;
    cell.closed = true;
    this.broadcast({ type: 'CELL_OWNED', cellId: cell.id, team });

    const won = this.checkWin(team);
    if (won) {
      this.state.status = 'ended';
      this.state.winner = team;
      this.state.matchWins[team] += 1;
      this.broadcast({ type: 'GAME_ENDED', winner: team });
    }

    this.state.currentTeamTurn = team;
    this.state.activeCellId = null;
    this.state.activeQuestion = null;
    this.state.buzzer = { locked: false, lockedBy: null, timerStart: null };
    this.state.attemptNo = 1;
    this.state.stage = 'first';
    this.state.updatedAt = Date.now();

    await this.persistState();
    this.broadcastState();
  }

  private clearTimer() {
    if (this.timerHandle !== null) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
  }

  private pickQuestionFromBoard(board: HurufCell[], cellId: string): HurufQuestion | null {
    const cell = board.find((item) => item.id === cellId);
    if (!cell) return null;

    const all =
      (questionBank as Record<string, Array<{ id: string; prompt: string; answer: string }>>)[cell.letter] ?? [];
    if (!all.length) return null;

    const used = this.usedQuestionsByCell.get(cellId) ?? [];
    let candidates = all.filter((q) => !used.includes(q.id));
    if (!candidates.length) {
      this.usedQuestionsByCell.set(cellId, []);
      candidates = [...all];
    }

    const next = candidates[Math.floor(Math.random() * candidates.length)];
    const updatedUsed = [...(this.usedQuestionsByCell.get(cellId) ?? []), next.id];
    this.usedQuestionsByCell.set(cellId, updatedUsed);

    return { ...next, letter: cell.letter };
  }

  private pickQuestion(cellId: string): HurufQuestion | null {
    return this.pickQuestionFromBoard(this.state.board, cellId);
  }

  private createBoard(): HurufCell[] {
    // Random letters from the supported question set, distributed as evenly as possible.
    const totalCells = GRID_SIZE * GRID_SIZE;
    const baseCount = Math.floor(totalCells / ALL_LETTERS.length);
    const remainder = totalCells % ALL_LETTERS.length;

    const lettersPool: string[] = [];
    const randomizedLetters = shuffle(ALL_LETTERS);
    randomizedLetters.forEach((letter, index) => {
      const count = baseCount + (index < remainder ? 1 : 0);
      for (let i = 0; i < count; i++) lettersPool.push(letter);
    });

    let shuffledLetters = shuffle(lettersPool);

    // Best effort to reduce immediate horizontal duplicates.
    for (let attempt = 0; attempt < 10; attempt++) {
      let hasAdjacentDuplicate = false;
      for (let i = 1; i < shuffledLetters.length; i++) {
        const sameRow = Math.floor(i / GRID_SIZE) === Math.floor((i - 1) / GRID_SIZE);
        if (sameRow && shuffledLetters[i] === shuffledLetters[i - 1]) {
          hasAdjacentDuplicate = true;
          break;
        }
      }
      if (!hasAdjacentDuplicate) break;
      shuffledLetters = shuffle(lettersPool);
    }

    const cells: HurufCell[] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const id = `${row}-${col}`;
        const letter = shuffledLetters[row * GRID_SIZE + col];
        cells.push({ id, letter, owner: null, closed: false, neighbors: [] });
      }
    }

    // Pointy-top hex neighbors
    const offsetsEven = [
      [-1, -1], [-1, 0],
      [0, -1],  [0, 1],
      [1, -1],  [1, 0],
    ];
    const offsetsOdd = [
      [-1, 0],  [-1, 1],
      [0, -1],  [0, 1],
      [1, 0],   [1, 1],
    ];

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = cells[row * GRID_SIZE + col];
        const offsets = row % 2 === 0 ? offsetsEven : offsetsOdd;
        cell.neighbors = offsets
          .map(([dr, dc]) => [row + dr, col + dc] as const)
          .filter(([r, c]) => r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE)
          .map(([r, c]) => `${r}-${c}`);
      }
    }

    return cells;
  }

  /**
   * Win condition:
   * Green team: must connect TOP row to BOTTOM row
   * Red team: must connect LEFT column to RIGHT column
   */
  private checkWin(team: Team): boolean {
    const owned = new Map(this.state.board.map((cell) => [cell.id, cell.owner]));
    const queue: string[] = [];
    const visited = new Set<string>();

    for (const cell of this.state.board) {
      if (owned.get(cell.id) !== team) continue;
      const row = Number(cell.id.split('-')[0]);
      const col = Number(cell.id.split('-')[1]);
      // Green: starts from top row (row === 0)
      // Red: starts from left column (col === 0)
      const starts = team === 'green' ? row === 0 : col === 0;
      if (starts) {
        queue.push(cell.id);
        visited.add(cell.id);
      }
    }

    while (queue.length) {
      const id = queue.shift() as string;
      const row = Number(id.split('-')[0]);
      const col = Number(id.split('-')[1]);
      // Green: reaches bottom row; Red: reaches right column
      const reached = team === 'green' ? row === GRID_SIZE - 1 : col === GRID_SIZE - 1;
      if (reached) return true;

      const cell = this.state.board.find((item) => item.id === id);
      if (!cell) continue;
      for (const neighbor of cell.neighbors) {
        if (visited.has(neighbor)) continue;
        if (owned.get(neighbor) !== team) continue;
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }

    return false;
  }

  private async persistState() {
    await this.stateStore.storage.put('session_state', this.state);
  }

  private broadcastState() {
    this.broadcast({ type: 'SESSION_STATE', state: this.state });
  }

  private broadcast(event: HurufServerEvent) {
    const msg = JSON.stringify(event);
    for (const socket of this.sockets.keys()) {
      socket.send(msg);
    }
  }
}

export default HurufSessionDO;
