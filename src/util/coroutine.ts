type CoroutineEventType = 'postupdate' | 'preupdate'

export function coroutine<T, E extends CoroutineEventType = 'preupdate'>(
  engine: ex.Engine,
  callback: (
    this: T
  ) => Generator<
    void,
    void,
    E extends 'preupdate' ? ex.PreUpdateEvent : ex.PostUpdateEvent
  >,
  _this?: T,
  event: E = 'preupdate' as E
) {
  return new Promise<void>((resolve) => {
    const generator = callback.call(_this as T)
    const loopFn = (ev: ex.PostUpdateEvent | ex.PreUpdateEvent) => {
      const result = generator.next(ev)
      if (result.done) {
        engine.off(event, loopFn as any)
        resolve(void 0)
      }
    }
    engine.on(event, loopFn as any)
  })
}
