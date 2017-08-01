'use strict'

import * as Phaser from 'phaser-ce'
import * as  _ from 'lodash'

import Constants from '../constants'
import JigsawPiece from '../entity/JigsawPiece'

/*
    Let's talk high-level goals, shall we? How will this game play out? Let's talk about that.

    So it all starts with an image. How we get to that image will come later. For now, let's get to that image.
    Once we have an image, let's cut it up into square pieces. Size and number of pieces will depend on how hard
    we wanna make this this.

    Once we have the pieces, let's rotate them a little and then make them move in as random a fashion as  we can.
    Once that's happening, the real game begins.

    A piece will be draggable. When a piece is clicked, it stops all motion and can be interacted with. It
    can be dragged around and rotated. In this state it has a glowy effect applied to it.

    When it is near a piece which was adjacent to it in the original image, the adjacent piece gets a glowy
    effect, too, but in a different color. If the two pieces are facing each other correctly, indicated by a yellowish glow[TODO], they can
    be attached together[TODO]. If they are facing each other from the wrong direction, we have two scenarios.

    One: The pieces are correctly aligned. In this case, the adjacent piece will be repelled, and the red glow will
    eventually fade[TODO].

    Two: The pieces are misaligned. In this case, the adjacent piece won't be repelled. It will simple maintain its
    trajectory and the yellow glow will eventually fade[TODO].
*/

const gameOptions = {
  INIT: {

    /*
        So at first I thought I'd have some sort of variable that stores the total number of pieces still
        remaining to rotate and then use a function to keep checking each frame if any are remaining and if
        there are, then keep the loop going.

        And I was gonna store this `ROTATING` as a boolean and once the number of pieces left to rotate reached
        0, I was gonna set this boolean to `false`. I'll leave it as an excercise to whoever the fuck is reading
        this to figure out why I just ended up not needing two variables. I'm probably insulting someone or the
        other by doing that. There will be people who are like, "Hey, you calling us dumb, bitch?", and some are
        gonna be like, "Clearly this young man is full of himself.", and others are gonna be like, "He be trolling!"

        I don't know, man, it's a weird world out there and you're gonna offend every third person you meet one
        way or the other.
    */
    ROTATING: 0,
    /*
        Turns out there isn't an angle 180 when taking just the integer part of the angle value. There's 179 and
        then there's -179. I don't know what happened to 180. So I just set it to 179. It won't matter in the
        long run. Any arbitrary angles will work as long as I limit the rotation of the selected piece to the
        same values.
    */
    ROTATION_SAMPLE: _.keys(Constants.ROTATION.SAMPLE).map(r => parseInt(r, 10)),
    READY: false,
    INPUT_ENABLED: false
  },

  JIGSAW: {
    PIECE_WIDTH: null,
    PIECE_HEIGHT: null
  },
  INPUT: {
    ROTATION: {
      RIGHT: Constants.ROTATION.SAMPLE,
      LEFT: _.invert(Constants.ROTATION.SAMPLE)
    },
    KEYS: {
      ROTATE_LEFT: null,
      ROTATE_RIGHT: null,
      FREEZE: null
    }
  }
}

const urls = {
  JIGSAW_IMAGE: '//res.cloudinary.com/scionofbytes-com/image/upload/v1500480728/shadow-of-mordor-poster.jpg'
}

/*
    Game entities are references to game objects like images, spritesheet, etc. When we load in any asset, it
    happens asynchronously either from disk or from the wire. It gets loaded against a string decided by the dev.
    The dev can then choose to access it from the cache using that same predefined string. Hence this entities
    object becomes the reference point for all game object access.
*/
const entities = {
  JIGSAW_IMAGE: `jigsaw_image`,
  JIGSAW_SPRITESHEET: `jigsaw_spritesheet`
}

export default class GameState extends Phaser.State {

  selectedPiece: JigsawPiece
  jigSawGroup: Phaser.Group
  startDelay: number

  readyToBegin: boolean
  readyForInput: boolean

  totalRotatingPieces: number
  frozen: boolean

  /*
     Quite simple and ingenious, if I may say so myself. I have just defined for myself a custom loading
     order. Each time one of the entities finishes loading, I just call the  to load the next entity
     dependent on this. This doesn't allow me to add multiple parallel dependencies, but we can easily fix
     that in the future.
  */
  loadNext: {
    [key: string]: () => any
  }

  init() {

    this.startDelay = Constants.INIT.DELAY
    this.readyToBegin = false
    this.readyForInput = false

    this.totalRotatingPieces = 0

    this.loadNext = {
      [entities.JIGSAW_IMAGE]: this.loadJigsawSpriteSheet.bind(this),
      [entities.JIGSAW_SPRITESHEET]: this.loadJigsawPieces.bind(this)
    }

    this.frozen = false
  }

  preload() {

    /*
      Wanted to get the game running on github pages. I mean, what better way of having the game shown to people
      than by just running it on the very repo it resides in? It's a fully front-end thing, anyway. It's kinda
      bullshit that I'm serving this in dev with a weird minimalistic express server.

      Anyway, github hosts project sites at <username>.github.io/<repo-name> so accessing local resources was
      gonna be a hassle since I couldn't refer to them from the js code and have them work on both dev and prod
      environments. I know I can solve this by simply aligning dev to prod, which is very simple to do, actually,
      but fuck it, I wanna do it this way, coz fuck you! that's why.
    */
    this.load.crossOrigin = 'Anonymous'
    this.load.image(entities.JIGSAW_IMAGE, urls.JIGSAW_IMAGE)

    /*
      Since the strings in the entity objects act as indices to the cache, we can also use them here to check if
      a specific entity has finished loading by putting a callback against the `fileComplete` event. This also
      lets us chain loading of assets. We can load an image firts, wait for its `fileComplete` even, then queue
      the loading of a spritesheet created from this image.

      As long as there are items in the queue, the `create`  won't be called.
    */
    this.load.onFileComplete.add(
      (progress, cacheKey) => {
        return this.loadNext[cacheKey] ? this.loadNext[cacheKey]() : null
      },
      this
    )
  }

  loadJigsawSpriteSheet() {

    const jigsawImageWidth = this.game.cache.getImage(entities.JIGSAW_IMAGE).width
    const jigsawImageHeight = this.game.cache.getImage(entities.JIGSAW_IMAGE).height

    gameOptions.JIGSAW.PIECE_WIDTH = jigsawImageWidth / Constants.JIGSAW.DIVISIONS
    gameOptions.JIGSAW.PIECE_HEIGHT = jigsawImageHeight / Constants.JIGSAW.DIVISIONS

    this.load.spritesheet(
      entities.JIGSAW_SPRITESHEET,
      urls.JIGSAW_IMAGE,
      gameOptions.JIGSAW.PIECE_WIDTH,
      gameOptions.JIGSAW.PIECE_HEIGHT
    )
  }

  loadJigsawPieces() {

    this.jigSawGroup = this.add.group()
    this.jigSawGroup.enableBody = true

    const {startingX, startingY} = GameState.computeStartingLocationOfImage()
    const totalPieces = GameState.computeTotalPieces()

    this.game.debug.text(`Starting X:Y: ${startingX}:${startingY}`, 0, 0, `#ffffff`)

    this.totalRotatingPieces = totalPieces

    type Grid = JigsawPiece[][]

    const grid: Grid = []

    for (let i = 0; i < totalPieces; i++) {

      const gridX = i % Constants.JIGSAW.DIVISIONS
      const gridY = (i - gridX) / Constants.JIGSAW.DIVISIONS

      const x = ((gridX * gameOptions.JIGSAW.PIECE_WIDTH) + startingX) + (gameOptions.JIGSAW.PIECE_WIDTH / 2)
      const y = ((gridY * gameOptions.JIGSAW.PIECE_HEIGHT) + startingY) + (gameOptions.JIGSAW.PIECE_HEIGHT / 2)

      const jigsawPiece = new JigsawPiece(this.game, x, y, entities.JIGSAW_SPRITESHEET, i)
      jigsawPiece.init({ index: 1 })
      jigsawPiece.sStore(`grid.position`, [gridX, gridY])

      grid[gridX] = grid[gridX] || []
      grid[gridX][gridY] = jigsawPiece

      GameState.decideTargetRotation(jigsawPiece)

      this.jigSawGroup.add(jigsawPiece)
      this.world.bringToTop(this.jigSawGroup)
    }

    this.jigSawGroup.children.forEach((jigsawPiece: JigsawPiece) => {

      const [gridX, gridY] = jigsawPiece.gStore(`grid.position`) as [number, number]

      if (gridY - 1 >= 0) {
        jigsawPiece.neighbors.top = grid[gridX][gridY - 1]
      }

      if (gridX + 1 < Constants.JIGSAW.DIVISIONS) {
        jigsawPiece.neighbors.right = grid[gridX + 1][gridY]
      }

      if (gridY + 1 < Constants.JIGSAW.DIVISIONS) {
        jigsawPiece.neighbors.bottom = grid[gridX][gridY + 1]
      }

      if (gridX - 1 >= 0) {
        jigsawPiece.neighbors.top = grid[gridX - 1][gridY]
      }

    })

  }

  static decideTargetRotation(jigsawPiece: JigsawPiece) {

    /*
        Here's the idea: each piece gets a rotation target. It's how turned around the piece wants to be. Hey! If
        that's what's gonna make the piece happy, who am I to judge, eh? Anyway, so we take a sample from one of 7
        target rotation positions in multiples of 45 each side (that's an eighth of a turn if I'm not too high).

        We'll later loop through and turn a little each frame till we reach the target rotation and then we'll set
        that second property to true. I'm guessing a simple boolean check will be much simpler than a comparision
        between the current angle and this target angle to determine if rotation has completed.
    */
    jigsawPiece.sStore(`rotationTarget`, _.sample(gameOptions.INIT.ROTATION_SAMPLE))
    jigsawPiece.sStore(`rotated`, false)
  }

  static computeStartingLocationOfImage() {

    const startingX = (Constants.DIMENSION.WIDTH - (gameOptions.JIGSAW.PIECE_WIDTH * Constants.JIGSAW.DIVISIONS)) / 2
    const startingY = (Constants.DIMENSION.HEIGHT - (gameOptions.JIGSAW.PIECE_HEIGHT * Constants.JIGSAW.DIVISIONS)) / 2

    return {
      startingX,
      startingY
    }
  }

  static computeTotalPieces(): number {
    return Constants.JIGSAW.DIVISIONS * Constants.JIGSAW.DIVISIONS
  }

  // ========== CREATE ==========

  create() {

    //  We're going to be using physics, so enable the Arcade Physics system.
    this.physics.startSystem(Phaser.Physics.ARCADE)

    /*
      I was initially doing this in a terrible way: by hand. I was maintaining variables for keeping counts of the delay,
      decrementing the delay by hand, rotating by hand and just...DAMN, I was doing a lot of nonsense. This is much
      simpler and makes more sense.

      We tween the delay down to 0, and then add rotation tweens to the jigsawPieces.
     */
    this.game.add.tween(this.startDelay).to(0, Constants.INIT.DELAY).start()
      .onComplete.add(() => this.addRotationTweensToJigsawPieces())
  }

  addRotationTweensToJigsawPieces() {

    /*
      Here's what we're doing: go through all the pieces and tween them from their current angle to the rotation decided
      for them, previously. Once that's done, we set their states to be rotated and decrement the rotation counter.
     */
    for (let i = this.jigSawGroup.children.length; i--;) {

      const jigsawPiece: JigsawPiece = this.jigSawGroup.children[i] as JigsawPiece
      const targetRotation = jigsawPiece.gStore(`rotationTarget`) as number

      this.game.add.tween(jigsawPiece).to({angle: targetRotation}, Constants.ROTATION.DURATION)
        .start()
        .onComplete.add(() => {
          jigsawPiece.markRotationTargetAchieved()
          this.totalRotatingPieces--
        })
    }
  }

  // ========== UPDATE ==========

  update() {

    this.checkReadyState()

    if (!this.isReady()) {
      return
    }

    this.enableInputIfNotEnabled()

    this.processInput()
    this.updateJigsawPieces()
  }

  checkReadyState() {

    if (this.isReady()) {
      return
    }

    if (!this.totalRotatingPieces) {
      this.isReady(true)
    }
  }

  isReady(state?: boolean) {

    if (state !== undefined) {
      this.readyToBegin = state
      return
    }

    return this.readyToBegin
  }

  enableInputIfNotEnabled() {

    if (gameOptions.INIT.INPUT_ENABLED) {
      return
    }

    gameOptions.INPUT.KEYS.ROTATE_LEFT = this.game.input.keyboard.addKey(Phaser.Keyboard.A)
    gameOptions.INPUT.KEYS.ROTATE_RIGHT = this.game.input.keyboard.addKey(Phaser.Keyboard.D)
    gameOptions.INPUT.KEYS.FREEZE = this.game.input.keyboard.addKey(Phaser.Keyboard.F)

    this.jigSawGroup.children.forEach((jigsawPiece: JigsawPiece) => {
      jigsawPiece.enableInput(this.selectPiece.bind(this))
    })
  }

  updateJigsawPieces() {

    /*
        Let's do this: let's go through all the children of the jigsaw group, (so, essentially, all the jigsaw
        pieces), and move them in a random x and a random y direction. We'll be applying acceleration to them,
        randomly, so it won't be a jerky movement. Applying velocity directly, now that would be chaos.
    */
    this.jigSawGroup.children.forEach((jigsawPiece: JigsawPiece) => {

      if (jigsawPiece === this.selectedPiece) {

        jigsawPiece.dontMove()

        return
      }

      if (!this.frozen) {
        jigsawPiece.moveRandomly()
      }
    })
  }

  processInput() {

    this.rotateSelectedPieceOnInput()
    this.freeze()
  }

  rotateSelectedPieceOnInput() {

    if (!this.selectedPiece) {
      return
    }

    const rotateLeftPressed = gameOptions.INPUT.KEYS.ROTATE_LEFT.downDuration(16)
    const rotateRightPressed = gameOptions.INPUT.KEYS.ROTATE_RIGHT.downDuration(16)

    if (rotateLeftPressed || rotateRightPressed) {

      const currentAngle = parseInt(this.selectedPiece.angle.toString())
      let desiredAngle = null

      if (rotateLeftPressed) {
        desiredAngle = gameOptions.INPUT.ROTATION.LEFT[currentAngle]
      } else {
        desiredAngle = gameOptions.INPUT.ROTATION.RIGHT[currentAngle]
      }

      this.selectedPiece.angle = desiredAngle
    }
  }

  freeze() {

    if (gameOptions.INPUT.KEYS.FREEZE.downDuration(16)) {

      if (this.frozen) {
        this.jigSawGroup.children.forEach((jigsawPiece: JigsawPiece) => {
          jigsawPiece.unfreeze()
        })
      } else {
        this.jigSawGroup.children.forEach((jigsawPiece: JigsawPiece) => {
          jigsawPiece.freeze()
        })
      }

      this.frozen = !this.frozen
    }
  }

  selectPiece(jigsawPiece: JigsawPiece) {

    if (this.selectedPiece === jigsawPiece) {
      return
    }

    if (this.selectedPiece) {
      this.selectedPiece.deglow()
    }

    this.selectedPiece = jigsawPiece

    this.jigSawGroup.bringToTop(jigsawPiece)
    jigsawPiece.reglow()
  }
}
