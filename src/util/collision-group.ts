import * as ex from 'excalibur'

const Player = ex.CollisionGroupManager.create('player')
const Enemy = ex.CollisionGroup.collidesWith([Player])
const Item = ex.CollisionGroup.collidesWith([Player])

const Hazard = ex.CollisionGroup.collidesWith([Player])
const Ground = ex.CollisionGroup.collidesWith([Player, Enemy])

export const CollisionGroup = {
  Ground,
  Enemy,
  Player,
  Hazard,
  Item,
}
