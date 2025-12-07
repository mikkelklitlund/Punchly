import { Logger } from 'pino'
import { Mocked, vi } from 'vitest'

export function mockRepo<T>(): Mocked<T> {
  return new Proxy({} as Record<string, any>, {
    get(target: Record<string, any>, prop: string | symbol) {
      if (!target[prop as string]) target[prop as string] = vi.fn()
      return target[prop as string]
    },
  }) as Mocked<T>
}

export const mockLogger = {
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
} as unknown as Logger
