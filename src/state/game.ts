'use strict'

import * as Phaser from 'phaser-ce'
import * as  _ from 'lodash'

import Constants from '../constants.ts'

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
    DELAY: Constants.INIT.DELAY,

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
    ROTATION_SAMPLE: _.keys(Constants.ROTATION_SAMPLE).map(r => parseInt(r, 10)),
    READY: false,
    INPUT_ENABLED: false
  },

  JIGSAW: {
    DIVISIONS: 3,
    PIECE_WIDTH: null,
    PIECE_HEIGHT: null
  },
  INPUT: {
    SELECTED: {
      /*
          Should be pretty self-explanatory. The `CURRENT` property points to the piece currently selected and
          the `GLOW` property points to the glowy effect for the
      */
      CURRENT: null
    },
    ROTATION: {
      RIGHT: Constants.ROTATION_SAMPLE,
      LEFT: _.invert(Constants.ROTATION_SAMPLE)
    },
    KEYS: {
      ROTATE_LEFT: null,
      ROTATE_RIGHT: null
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

  jigSawGroup: Phaser.Group
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

    this.loadNext = {
      [entities.JIGSAW_IMAGE]: this.loadJigsawSpriteSheet.bind(this),
      [entities.JIGSAW_SPRITESHEET]: this.loadJigsawPieces.bind(this)
    }
  }

  preload() {

    /*
        Wanted to get the game running on github pages. I mean, what better way of having the game shown to people
        than by just running it on the very repo it resides in? It's a fully front-end thing, anyway. It's kinda
        bullshit that I'm serving this in dev with a weird minimalistic express server.

        Anyway, github hosts project sites at <username>.github.io/<repo-name> so accessing local resources was
        gonna be a hassle since I couldn't refer to them from the js code and have them work on both dev and prod
        enviroments. I know I can solve this by simply aligning dev to prod, which is very simple to do, actually,
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
      (progress, cacheKey, success, totalLoaded, totalFiles) => {
        return this.loadNext[cacheKey] ? this.loadNext[cacheKey]() : null
      },
      this
    )
  }

  loadJigsawSpriteSheet() {

    console.log(this)

    const jigsawImageWidth = this.game.cache.getImage(entities.JIGSAW_IMAGE).width
    const jigsawImageHeight = this.game.cache.getImage(entities.JIGSAW_IMAGE).height

    gameOptions.JIGSAW.PIECE_WIDTH = jigsawImageWidth / gameOptions.JIGSAW.DIVISIONS
    gameOptions.JIGSAW.PIECE_HEIGHT = jigsawImageHeight / gameOptions.JIGSAW.DIVISIONS

    this.load.spritesheet(
      entities.JIGSAW_SPRITESHEET,
      urls.JIGSAW_IMAGE,
      gameOptions.JIGSAW.PIECE_WIDTH,
      gameOptions.JIGSAW.PIECE_HEIGHT
    )
  }

  enableCustom(jigsawPiece) {

    /*
        I don't know if Phaser has a way to assign arbitrary values on game objects but since they are just POJOs
        at the end of the day, I'm just gonna assign the ones I need to hold some specific state a `custom` object.
    */
    jigsawPiece.custom = {}
  }

  decideTargetRotation(jigsawPiece) {

    /*
        Here's the idea: each piece gets a roation target. It's how turned around the piece wants to be. Hey! If
        that's what's gonna make the piece happy, who am I to judge, eh? Anyway, so we take a sample from one of 7
        target roation positions in multiples of 45 each side (that's an eighth of a turn if I'm not too high).

        We'll later loop through and turn a little each frame till we reach the target rotation and then we'll set
        that second property to true. I'm guessing a simple boolean check will be much simpler than a comparision
        between the current angle and this target angle to determine if rotation has completed.
    */
    jigsawPiece.custom.targetRotation = _.sample(gameOptions.INIT.ROTATION_SAMPLE)
    jigsawPiece.custom.reachedTargetRotation = false
  }

  loadJigsawPieces() {

    this.jigSawGroup = this.add.group()
    this.jigSawGroup.enableBody = true

    const startingX = (Constants.DIMENSION.WIDTH - (gameOptions.JIGSAW.PIECE_WIDTH * gameOptions.JIGSAW.DIVISIONS)) / 2
    const startingY = (Constants.DIMENSION.HEIGHT - (gameOptions.JIGSAW.PIECE_HEIGHT * gameOptions.JIGSAW.DIVISIONS)) / 2

    const totalPieces = gameOptions.JIGSAW.DIVISIONS * gameOptions.JIGSAW.DIVISIONS
    gameOptions.INIT.ROTATING = totalPieces

    for (let i = 0; i < totalPieces; i++) {

      const row = i % gameOptions.JIGSAW.DIVISIONS
      const column = (i - row) / gameOptions.JIGSAW.DIVISIONS

      const x = (row * gameOptions.JIGSAW.PIECE_WIDTH) + startingX
      const y = (column * gameOptions.JIGSAW.PIECE_HEIGHT) + startingY

      const jigsawPiece = this.add.sprite(x, y, entities.JIGSAW_SPRITESHEET, i, this.jigSawGroup)

      /*
          When they spin at the beginning of the game, just to get them out of whack, they need to be doing that
          around their centers and not around some random corner (probably the top left corner).
      */
      jigsawPiece.anchor.setTo(0.5, 0.5)
      jigsawPiece.body.collideWorldBounds = true
      jigsawPiece.body.bounce.set(0.8)

      this.enableCustom(jigsawPiece)
      this.decideTargetRotation(jigsawPiece)
    }

    this.createGlowPiece(this.jigSawGroup.children[0])
  }

  createGlowPiece(jigsawPiece) {

    gameOptions.INPUT.SELECTED.GLOW = this.add.sprite(0, 0, entities.JIGSAW_SPRITESHEET, 0)

    gameOptions.INPUT.SELECTED.GLOW.tint = 0xffff00
    gameOptions.INPUT.SELECTED.GLOW.alpha = 0.0
    gameOptions.INPUT.SELECTED.GLOW.scale.setTo(1.1, 1.1)
  }

  // ========== CREATE ==========

  create() {

    //  We're going to be using physics, so enable the Arcade Physics system.
    this.physics.startSystem(Phaser.Physics.ARCADE)

    gameOptions.INPUT.KEYS.ROTATE_LEFT = this.game.input.keyboard.addKey(Phaser.Keyboard.A)
    gameOptions.INPUT.KEYS.ROTATE_RIGHT = this.game.input.keyboard.addKey(Phaser.Keyboard.D)
  }

  // ========== UPDATE ==========

  update() {

    this.delay()
    this.getIntoAngle()
    this.checkReadyState()

    if (!this.isReady()) {
      return
    }

    this.enableInputIfNotEnabled()
    this.updateJigsawPieces()
  }

  delay() {

    /*
        At a framerate of 60, this gives 1.5 seconds of delay. Think of it as a sort of splash screen. Of course,
        we'll have to get a realsplash screen when it becomes a proper this.
    */
    if (gameOptions.INIT.DELAY > 0) {
      gameOptions.INIT.DELAY--

    }
  }

  getIntoAngle() {

    if (!gameOptions.INIT.ROTATING) {
      return
    }

    for (const jigsawPiece of this.jigSawGroup.children) {

      if (jigsawPiece.custom.reachedTargetRotation) {
        continue
      }

      /*
          Fun bug. Initially the list of target angles didn't have 0 in them but then I introduced it. So now some
          pieces are gonna be 0 and not rotate at all. But since I'd not changed the computation, a 0/0 was
          leading to the buggy behavior one can expect when one tries to do math that goes against the
          fundamental nature of the Universe.

          Sure we could check for a 0/0 specifically and take some action in that case but why do that when we can
          write code that doesn't have a special condition check and is thus, in
          [good taste](https://goo.gl/gf3WCD).
      */
      if (jigsawPiece.custom.targetRotation === parseInt(jigsawPiece.angle)) {

        jigsawPiece.custom.reachedTargetRotation = true
        gameOptions.INIT.ROTATING--

        continue
      }

      const rotationValue = jigsawPiece.custom.targetRotation / Math.abs(jigsawPiece.custom.targetRotation)
      jigsawPiece.angle += rotationValue
    }
  }

  checkReadyState() {

    if (gameOptions.INIT.READY) {
      return
    }

    if (!gameOptions.INIT.ROTATING) {
      gameOptions.INIT.READY = true
    }
  }

  isReady() {
    return gameOptions.INIT.READY
  }

  enableInputIfNotEnabled() {

    if (gameOptions.INIT.INPUT_ENABLED) {
      return
    }

    for (const jigsawPiece of this.jigSawGroup.children) {
      this.enableInput(jigsawPiece)
    }
  }

  enableInput(jigsawPiece) {

    /*
        So let's enable processInput on the jigsaw pieces. Not just that, we enable drag too. That first param makes sure
        that on clicking, the piece gets centered on the mouse, and the second ensures that the piece comes up to
        the top. Easier for folks to see it, that way.
    */
    jigsawPiece.inputEnabled = true
    jigsawPiece.input.enableDrag(false, false)

    jigsawPiece.events.onInputDown.add(this.selectPiece.bind(this), this)
  }

  updateJigsawPieces() {

    /*
        Let's do this: let's go through all the children of the jigsaw group, (so, essentially, all the jigsaw
        pieces), and move them in a random x and a random y direction. We'll be applying acceleration to them,
        randomly, so it won't be a jerky movement. Applying velocity directly, now that would be chaos.
    */
    for (const jigsawPiece of this.jigSawGroup.children) {

      /*
          If this is the selected piece, let's stop it's movement completely and then not do anything to it.
          It's frozen in place.
      */
      if (jigsawPiece === gameOptions.INPUT.SELECTED.CURRENT) {

        this.copySpatialConfig(jigsawPiece.custom.glow, gameOptions.INPUT.SELECTED.CURRENT)

        jigsawPiece.body.velocity.x = 0
        jigsawPiece.body.velocity.y = 0

        // But the Input must go on.
        this.processInput(jigsawPiece)

        continue
      }

      this.moveRandomly(jigsawPiece)
    }
  }

  processInput(selectedPiece) {

    this.rotateOnInput(selectedPiece)
  }

  rotateOnInput(selectedPiece) {

    const rotateLeftPressed = gameOptions.INPUT.KEYS.ROTATE_LEFT.downDuration(16)
    const rotateRightPressed = gameOptions.INPUT.KEYS.ROTATE_RIGHT.downDuration(16)

    if (rotateLeftPressed || rotateRightPressed) {

      const currentAngle = parseInt(selectedPiece.angle)
      let desiredAngle = null

      if (rotateLeftPressed) {
        desiredAngle = gameOptions.INPUT.ROTATION.LEFT[currentAngle]
      } else {
        desiredAngle = gameOptions.INPUT.ROTATION.RIGHT[currentAngle]
      }

      selectedPiece.angle = desiredAngle
    }
  }

  moveRandomly(jigsawPiece) {

    /*
        Pretty even chance of either direction being picked.
    */
    const dirX = Math.random() < 0.5 ? -1 : 1
    const dirY = Math.random() < 0.5 ? -1 : 1

    /*
        And then it's all about picking a random acceleration, scaling it up to 500, and picking a direction
        by using previous values.
    */
    jigsawPiece.body.acceleration.x = Math.random() * 500 * dirX
    jigsawPiece.body.acceleration.y = Math.random() * 500 * dirY
  }

  selectPiece(jigsawPiece) {

    if (gameOptions.INPUT.SELECTED.CURRENT) {
      this.destroyGlow(gameOptions.INPUT.SELECTED.CURRENT)
    }

    gameOptions.INPUT.SELECTED.CURRENT = jigsawPiece
    jigsawPiece.custom.selected = true

    this.applyGlow(jigsawPiece)
  }

  destroyGlow(jigsawPiece) {

    jigsawPiece.custom.glow.destroy()
    jigsawPiece.custom.glow = undefined
  }

  applyGlow(jigsawPiece) {

    if (jigsawPiece.custom.glow) {
      return
    }

    jigsawPiece.custom.glow = this.add.sprite(jigsawPiece.x, jigsawPiece.y, entities.JIGSAW_SPRITESHEET, 0)

    /*
        Bring both the glow and the selected piece to the top of the render stack. Bringing the glow first and the
        piece second should ideally put the piece at the top but that doesn't seem to be the case, I'm not sure why.

        Once that's done, align them spatially. And then make the glow slightly visible.
    */

    this.world.bringToTop(jigsawPiece.custom.glow)
    this.world.bringToTop(jigsawPiece)

    this.copySpatialConfig(jigsawPiece.custom.glow, jigsawPiece)

    jigsawPiece.custom.glow.tint = 0xffff00
    jigsawPiece.custom.glow.scale.setTo(1.1, 1.1)
    jigsawPiece.custom.glow.alpha = 0.3
  }

  /**
   * This one's quite simple, really. Both items need to be in the same spatial location. Specifically the second
   * sprite wants to be where the first it and shadow it exactly. So their anchors are synchronized, followed by their
   * locations and finally their rotation.
   *
   * @param {Sprite} first
   * @param {Sprite} second
   */
  copySpatialConfig(first, second) {

    first.anchor.x = second.anchor.x
    first.anchor.y = second.anchor.y

    first.x = second.x
    first.y = second.y

    first.angle = second.angle
  }
}
