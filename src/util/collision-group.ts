import * as ex from 'excalibur'

const Player = ex.CollisionGroupManager.create('player')
const Enemy = ex.CollisionGroupManager.create('enemy')
const Ground = ex.CollisionGroup.collidesWith([Player, Enemy])

export const CollisionGroup = {
  Ground,
  Enemy,
  Player,
}
