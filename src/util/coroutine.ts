import * as ex from 'excalibur'
type CoroutineEventType = 'postupdate' | 'preupdate'

export function coroutine<
  T extends ex.Engine | ex.Entity | ex.Scene,
  E extends CoroutineEventType = 'preupdate'
>(
  self: T,
  callback: (
    this: T
  ) => Generator<
    void,
    void,
    E extends 'preupdate' ? ex.PreUpdateEvent : ex.PostUpdateEvent
  >,
  event: E = 'preupdate' as E
) {
  let engine: ex.Engine
  if (self instanceof ex.Engine) {
    engine = self
  } else if (self instanceof ex.Entity) {
    engine = self.scene!.engine
  } else if (self instanceof ex.Scene) {
    engine = self.engine
  }

  return new Promise<void>((resolve) => {
    const generator = callback.call(self)
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
