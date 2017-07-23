'use strict'

import * as _ from 'lodash'
import {Sprite} from 'phaser-ce'

import LocalCache from './LocalCache'

interface JigsawPieceConfig {
  index: number
}

export default class JigsawPiece extends Sprite implements LocalCache {

  index: number
  glow: Sprite
  localCache: {}

  init(config: JigsawPieceConfig) {

    this.index = config.index
    this.localCache = {}

    this.game.physics.arcade.enable(this)
    /*
        When they spin at the beginning of the game (just to get them out of whack) they need to be doing that
        around their centers and not around some random corner (probably the top left corner).
    */
    this.anchor.setTo(0.5, 0.5)

    this.body.collideWorldBounds = true
    this.body.bounce.set(0.8)

    this.initGlow()
  }

  initGlow() {

    this.glow = new Sprite(this.game, this.x, this.y, this.texture, this.frame)

    this.glow.tint = 0xffff00
    this.glow.alpha = 0.0
    this.glow.scale.setTo(1.1, 1.1)

    this.game.add.existing(this.glow)
  }

  reachedTargetRotation() {

    if (this.gStore(`reachedTargetRotation`)) {
      return true
    }

    const trulyReached = this.gStore(`targetRotation`) === parseInt(this.angle.toString(), 10)

    if (trulyReached) {
      this.sStore(`reachedTargetRotation`, true)
    }

    return trulyReached
  }

  markTargetRotationAchieved() {
    this.sStore(`targetRotation`, true)
  }

  rotate() {

    const targetRotation = this.gStore(`targetRotation`) as number
    const absoluteTargetRotation = Math.abs(targetRotation)

    /*
      Normalizing the target rotation value, giving either a +1 or -1. And then we add that to the existing angle to
      get rotation.
     */
    this.angle += (targetRotation / absoluteTargetRotation)
  }

  enableInput(onClickListener) {

    /*
        So let's enable processInput on the jigsaw pieces. Not just that, we enable drag too. That first param makes sure
        that on clicking, the piece gets centered on the mouse, and the second ensures that the piece comes up to
        the top. Easier for folks to see it, that way.
    */
    this.inputEnabled = true
    this.input.enableDrag(false, false)

    this.events.onInputDown.add(onClickListener, this)
  }

  deglow() {
    this.glow.alpha = 0.0
  }

  reglow() {
    this.glow.alpha = 0.6
  }

  updateGlow() {
    JigsawPiece.copySpatialConfig(this.glow, this)
  }

  dontMove() {

    this.body.acceleration.x = 0
    this.body.acceleration.y = 0

    this.body.velocity.x = 0
    this.body.velocity.y = 0
  }

  moveRandomly() {

    /*
        Pretty even chance of either direction being picked.
    */
    const dirX = Math.random() < 0.5 ? -1 : 1
    const dirY = Math.random() < 0.5 ? -1 : 1

    /*
        And then it's all about picking a random acceleration, scaling it up to 500, and picking a direction
        by using previous values.
    */
    this.body.acceleration.x = Math.random() * 500 * dirX
    this.body.acceleration.y = Math.random() * 500 * dirY
  }

  /**
   * This one's quite simple, really. Both items need to be in the same spatial location. Specifically the second
   * sprite wants to be where the first it and shadow it exactly. So their anchors are synchronized, followed by their
   * locations and finally their rotation.
   *
   * @param {Sprite} first
   * @param {Sprite} second
   */
  static copySpatialConfig(first: Sprite, second: Sprite) {

    first.anchor.x = second.anchor.x
    first.anchor.y = second.anchor.y

    first.x = second.x
    first.y = second.y

    first.angle = second.angle
  }

  gStore(path) {
    return _.get(this.localCache, path)
  }

  sStore(path, value) {
    _.set(this.localCache, path, value)
  }
}
