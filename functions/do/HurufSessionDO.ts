import type { HurufCell, HurufClientEvent, HurufQuestion, HurufServerEvent, HurufSessionState, Team } from '../../../shared/huruf/types';
import questionBank from '../../../shared/huruf/questions.ar.json';

type SocketMeta = { role: 'main' | 'mobile'; team?: Team };

const GRID_SIZE = 6;
const LETTERS = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح'];

const otherTeam = (team: Team): Team => (team === 'green' ? 'red' : 'green');

export class HurufSessionDO {
  private readonly sockets = new Map<WebSocket, SocketMeta>();
  private state: HurufSessionState;
  private readonly usedQuestionsByCell = new Map<string, string[]>();

  constructor(private readonly stateStore: DurableObjectState) {
    this.state = this.buildInitialState();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.endsWith('/init') && request.method === 'POST') {
      await this.restoreOrInit();
      return new Response(JSON.stringify({ ok: true, sessionId: this.state.sessionId }), { headers: { 'content-type': 'application/json' } });
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
      buzzer: { locked: false, lockedBy: null },
      attemptNo: 1,
      stage: 'first',
      allowedBuzzTeams: ['green', 'red'],
      winner: null,
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
        socket.send(JSON.stringify({ type: 'ERROR', message: 'Malformed event payload' } satisfies HurufServerEvent));
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
        await this.newQuestion(true);
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
          peer.send(JSON.stringify({ type: 'ERROR', message: 'تم استبدال هذا الجهاز بجهاز آخر لنفس الفريق.' } satisfies HurufServerEvent));
          peer.close(4001, 'Replaced by newer device');
          this.sockets.delete(peer);
        }
      }
    }
    this.sockets.set(socket, { role: event.role, team: event.team });
    socket.send(JSON.stringify({ type: 'SESSION_STATE', state: this.state } satisfies HurufServerEvent));
  }

  private async startGame() {
    this.state.status = 'playing';
    this.state.winner = null;
    this.state.currentTeamTurn = 'green';
    this.state.attemptNo = 1;
    this.state.stage = 'first';
    this.state.activeCellId = null;
    this.state.activeQuestion = null;
    this.state.buzzer = { locked: false, lockedBy: null };
    this.state.allowedBuzzTeams = ['green', 'red'];
    this.state.updatedAt = Date.now();
    await this.persistState();
    this.broadcastState();
  }

  private async selectCell(cellId: string) {
    if (this.state.status !== 'playing') return;
    if (this.state.activeCellId) return;

    const cell = this.state.board.find((c) => c.id === cellId);
    if (!cell || cell.closed) return;

    this.state.activeCellId = cellId;
    this.state.attemptNo = 1;
    this.state.stage = 'first';
    this.state.allowedBuzzTeams = ['green', 'red'];
    this.state.buzzer = { locked: false, lockedBy: null };

    const question = this.pickQuestion(cellId);
    if (question) {
      this.state.activeQuestion = question;
      this.broadcast({ type: 'QUESTION_CHANGED', cellId, question });
    }

    this.state.updatedAt = Date.now();
    await this.persistState();
    this.broadcastState();
  }

  private async newQuestion(resetAttempt: boolean) {
    if (!this.state.activeCellId) return;
    const question = this.pickQuestion(this.state.activeCellId);
    if (!question) return;

    if (resetAttempt) {
      this.state.attemptNo = 1;
    }

    this.state.stage = 'first';
    this.state.allowedBuzzTeams = ['green', 'red'];
    this.state.activeQuestion = question;
    this.state.buzzer = { locked: false, lockedBy: null };
    this.state.updatedAt = Date.now();

    await this.persistState();
    this.broadcast({ type: 'QUESTION_CHANGED', cellId: this.state.activeCellId, question });
    this.broadcastState();
  }

  private async resetBuzzer() {
    this.state.buzzer = { locked: false, lockedBy: null };
    this.state.updatedAt = Date.now();
    await this.persistState();
    this.broadcast({ type: 'BUZZ_RESET' });
    this.broadcastState();
  }

  private async handleBuzzRequest(team: Team) {
    if (this.state.status !== 'playing') return;
    if (!this.state.activeCellId) return;
    if (this.state.buzzer.locked) return;
    if (!this.state.allowedBuzzTeams.includes(team)) return;

    this.state.buzzer = { locked: true, lockedBy: team };
    this.state.updatedAt = Date.now();
    await this.persistState();
    this.broadcast({ type: 'BUZZ_LOCKED', team });
    this.broadcastState();
  }

  private async markWrong() {
    if (!this.state.activeCellId || !this.state.buzzer.lockedBy) return;

    if (this.state.stage === 'first') {
      this.state.stage = 'other';
      this.state.allowedBuzzTeams = [otherTeam(this.state.buzzer.lockedBy)];
      this.state.buzzer = { locked: false, lockedBy: null };
    } else if (this.state.stage === 'other') {
      this.state.stage = 'final';
      this.state.allowedBuzzTeams = ['green', 'red'];
      this.state.buzzer = { locked: false, lockedBy: null };
    } else {
      if (this.state.attemptNo === 1) {
        this.state.attemptNo = 2;
      }
      await this.newQuestion(false);
      return;
    }

    this.state.updatedAt = Date.now();
    await this.persistState();
    this.broadcastState();
  }

  private async markCorrect() {
    const team = this.state.buzzer.lockedBy;
    const activeCellId = this.state.activeCellId;
    if (!team || !activeCellId) return;

    const cell = this.state.board.find((item) => item.id === activeCellId);
    if (!cell || cell.closed) return;

    cell.owner = team;
    cell.closed = true;
    this.broadcast({ type: 'CELL_OWNED', cellId: cell.id, team });

    const won = this.checkWin(team);
    if (won) {
      this.state.status = 'ended';
      this.state.winner = team;
      this.broadcast({ type: 'GAME_ENDED', winner: team });
    }

    this.state.currentTeamTurn = team;
    this.state.activeCellId = null;
    this.state.activeQuestion = null;
    this.state.buzzer = { locked: false, lockedBy: null };
    this.state.attemptNo = 1;
    this.state.stage = 'first';
    this.state.allowedBuzzTeams = ['green', 'red'];
    this.state.updatedAt = Date.now();

    await this.persistState();
    await this.stateStore.storage.put(`cell_owned_${cell.id}`, { owner: team, at: Date.now() });
    this.broadcastState();
  }

  private pickQuestion(cellId: string): HurufQuestion | null {
    const cell = this.state.board.find((item) => item.id === cellId);
    if (!cell) return null;

    const all = (questionBank as Record<string, Array<{ id: string; prompt: string; answer: string }>>)[cell.letter] ?? [];
    if (!all.length) return null;

    const used = this.usedQuestionsByCell.get(cellId) ?? [];
    let next = all.find((q) => !used.includes(q.id));
    if (!next) {
      this.usedQuestionsByCell.set(cellId, []);
      next = all[0];
    }

    const updatedUsed = [...(this.usedQuestionsByCell.get(cellId) ?? []), next.id];
    this.usedQuestionsByCell.set(cellId, updatedUsed);

    return { ...next, letter: cell.letter };
  }

  private createBoard(): HurufCell[] {
    const cells: HurufCell[] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const id = `${row}-${col}`;
        const letter = LETTERS[(row * GRID_SIZE + col) % LETTERS.length];
        cells.push({ id, letter, owner: null, closed: false, neighbors: [] });
      }
    }

    const offsetsEven = [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];
    const offsetsOdd = [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];

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

  private isTopEdge(cellId: string) {
    return Number(cellId.split('-')[0]) === 0;
  }

  private isBottomEdge(cellId: string) {
    return Number(cellId.split('-')[0]) === GRID_SIZE - 1;
  }

  private isLeftEdge(cellId: string) {
    return Number(cellId.split('-')[1]) === 0;
  }

  private isRightEdge(cellId: string) {
    return Number(cellId.split('-')[1]) === GRID_SIZE - 1;
  }

  private checkWin(team: Team): boolean {
    const owned = new Map(this.state.board.map((cell) => [cell.id, cell.owner]));

    const queue: string[] = [];
    const visited = new Set<string>();

    for (const cell of this.state.board) {
      if (owned.get(cell.id) !== team) continue;
      const starts = team === 'green' ? this.isTopEdge(cell.id) : this.isLeftEdge(cell.id);
      if (starts) {
        queue.push(cell.id);
        visited.add(cell.id);
      }
    }

    while (queue.length) {
      const id = queue.shift() as string;
      const reached = team === 'green' ? this.isBottomEdge(id) : this.isRightEdge(id);
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
    await this.stateStore.storage.put('checkpoint_last_update', this.state.updatedAt);
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
