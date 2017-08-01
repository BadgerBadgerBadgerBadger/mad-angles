'use strict'

import * as _ from 'lodash'
import {Sprite, Graphics} from 'phaser-ce'

import LocalCache from './LocalCache'

interface JigsawPieceConfig {
  index: number
}

interface Neighbors {
  top?: JigsawPiece,
  right?: JigsawPiece,
  bottom?: JigsawPiece,
  left?: JigsawPiece
}

interface KineticState {
  velocity: {
    x: number,
    y: number
  },
  acceleration: {
    x: number,
    y: number
  }
}

export default class JigsawPiece extends Sprite implements LocalCache {

  index: number
  glow: Sprite
  localCache: {}
  neighbors: Neighbors

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
    this.neighbors = {}
  }

  initGlow() {

    /*
      Previously, I was using a copy of this piece's sprite, tinting it yellow and then setting an opacity of 0.something
      when I needed it visible, otherwise, 0. Safe to say, this was a terrible idea. As it wasn't part of the main group
      it was always behind every other piece (although this piece was on top) and you can imagine how weird that looked.

      I even tried adding the piece as a child (and later adding a whole rectangle graphic as a child), but children are
      always drawn after the parent and hence on top.

      So the solution is to go with an outline. It's just a line drawn all around the sprite with thickness that would
      simulate the look of an outline.

      Converting it into a sprite since graphic objects are expensive to manage.
     */
    const outlineGraphic = new Graphics(this.game, 0, 0)
      .lineStyle(10,0xffff00)
      .moveTo(-5, -5)
      .lineTo(this.width + 5,  -5)
      .lineTo(this.width + 5, this.height + 5)
      .lineTo(- 5, this.height + 5)
      .lineTo(-5, -5)

    this.glow = new Sprite(this.game, 0, 0, outlineGraphic.generateTexture())

    this.glow.visible = false

    this.glow.anchor.x = 0.5
    this.glow.anchor.y = 0.5

    this.addChild(this.glow)
  }

  markRotationTargetAchieved() {
    this.sStore(`rotationTarget`, true)
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
    this.glow.visible = false
  }

  reglow() {
    /*
      This works much better than changing opacity. It probably changes opacity. It probably just doesn't draw the sprite
      when this is set which is presumably much cheaper to achieve than drawing a sprite with some opacity, even if that
      is 0.
     */
    this.glow.visible = true
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

  freeze() {

    this.sStore(
      `kineticState`,
      {
        velocity: {
          x: this.body.velocity.x,
          y: this.body.velocity.y
        },
        acceleration: {
          x: this.body.acceleration.x,
          y: this.body.acceleration.y
        }
      }
    )

    this.body.velocity.x = 0
    this.body.velocity.y = 0
    this.body.acceleration.x = 0
    this.body.acceleration.y = 0
  }

  unfreeze() {

    const kineticState = this.gStore(`kineticState`) as KineticState

    this.body.velocity.x = kineticState.velocity.x
    this.body.velocity.y = kineticState.velocity.y
    this.body.acceleration.x = kineticState.acceleration.x
    this.body.acceleration.y = kineticState.acceleration.y
  }

  gStore(path) {
    return _.get(this.localCache, path)
  }

  sStore(path, value) {
    _.set(this.localCache, path, value)
  }
}
