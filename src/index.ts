'use strict'


import 'pixi'
import 'p2'
import * as Phaser from 'phaser-ce'

(<any>window).game = (<any>window).game || {}

import GameState from './state/game.ts'
import Constants from './constants.ts'

class Game extends Phaser.Game {

  constructor () {

    const docElement = document.documentElement
    const width = docElement.clientWidth > Constants.DIMENSION.WIDTH ?
      Constants.DIMENSION.WIDTH : docElement.clientWidth
    const height = docElement.clientHeight > Constants.DIMENSION.HEIGHT
      ? Constants.DIMENSION.HEIGHT : docElement.clientHeight

    super(width, height, Phaser.CANVAS, `content`, null)

    this.state.add(`Game`, GameState, false)
    this.state.start(`Game`)
  }
}

(<any>window).game = new Game()
