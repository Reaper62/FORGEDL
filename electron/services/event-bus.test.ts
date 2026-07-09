import { describe, expect, it } from 'vitest'
import { InMemoryEventSink, NoopEventSink } from './event-bus'

describe('InMemoryEventSink', () => {
  it('records emitted events', () => {
    const sink = new InMemoryEventSink()
    sink.send('queue:changed')
    sink.send('download:progress:a', { id: 'a', progress: 50 })
    const history = sink.history()
    expect(history).toHaveLength(2)
    expect(history[0].channel).toBe('queue:changed')
    expect(history[1].channel).toBe('download:progress:a')
  })

  it('take() returns and clears', () => {
    const sink = new InMemoryEventSink()
    sink.send('a')
    sink.send('b')
    expect(sink.take()).toHaveLength(2)
    expect(sink.history()).toHaveLength(0)
  })

  it('clear() empties the buffer in place', () => {
    const sink = new InMemoryEventSink()
    sink.send('x')
    sink.clear()
    expect(sink.history()).toHaveLength(0)
  })

  it('isReady() reports true', () => {
    expect(new InMemoryEventSink().isReady()).toBe(true)
  })
})

describe('NoopEventSink', () => {
  it('send is a no-op for any args', () => {
    const sink = new NoopEventSink()
    expect(() => sink.send('anything', { payload: 1 })).not.toThrow()
    expect(() => sink.send('only-channel')).not.toThrow()
  })
  it('isReady() reports false', () => {
    expect(new NoopEventSink().isReady()).toBe(false)
  })
})
