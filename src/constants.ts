'use strict'

export default {

  INIT: {
    DELAY: 1000 //ms
  },

  ROTATION: {
    DURATION: 1000,
    SAMPLE: {
      0: 45,
      45: 90,
      90: 135,
      135: 179,
      179: -135,
      '-135': -90,
      '-90': -45,
      '-45': 0
    }
  },

  DIMENSION: {
    WIDTH: 900,
    HEIGHT: 700
  },

  JIGSAW: {
    DIVISIONS: 3,
  }
}
