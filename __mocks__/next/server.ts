export class NextResponse {
  private readonly body: unknown;
  private readonly init: { status?: number } | undefined;

  constructor(body: unknown, init?: { status?: number }) {
    this.body = body;
    this.init = init;
  }

  static json(body: unknown, init?: { status?: number }) {
    return new NextResponse(body, init);
  }

  get status(): number {
    return this.init?.status ?? 200;
  }

  async json(): Promise<unknown> {
    return this.body;
  }
}

// Тип-заглушка для совместимости с type import'ами.
// В тестах конкретная структура запроса не используется.
export type NextRequest = unknown;

