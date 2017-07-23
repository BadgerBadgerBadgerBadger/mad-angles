'use strict'


import 'pixi'
import 'p2'
import * as Phaser from 'phaser-ce'

(<any>window).game = (<any>window).game || {}

import GameState from './state/Game'
import Constants from './constants'

class Game extends Phaser.Game {

  constructor () {

    const width = Constants.DIMENSION.WIDTH
    const height = Constants.DIMENSION.HEIGHT

    super(width, height, Phaser.CANVAS, `content`, null)

    this.state.add(`Game`, GameState, false)
    this.state.start(`Game`)
  }
}

(<any>window).game = new Game()
