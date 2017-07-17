'use strict'

/* global Phaser */

window.onload = phase

function phase() {
    

    const gameOptions = {
        DELAY: 90,
        
        DIMENSION: {
            WIDTH: 1366,
            HEIGHT: 900
        },
        
        JIGSAW: {
            DIVISIONS: 9,
            PIECE_WIDTH: null,
            PIECE_HEIGHT: null
        }
    }
    const game = new Phaser.Game(
        gameOptions.DIMENSION.WIDTH,
        gameOptions.DIMENSION.HEIGHT,
        Phaser.AUTO, '', {
            preload: preload,
            create: create,
            update: update
        }
    )
    
    const urls = {
        JIGSAW_IMAGE: 'assets/shadow-mordor-HD-wallpaper.jpg'
    }
    
    const entities = {
        JIGSAW_IMAGE: `jigsaw_image`,
        JIGSAW_SPRITESHEET: `jigsaw_spritesheet`
    }
    
    let jigsawSprite
    let jigSawGroup
    
    function createJigsawSpriteSheet() {
        
        const jigsawImageWidth = game.cache.getImage(entities.JIGSAW_IMAGE).width
        const jigsawImageHeight = game.cache.getImage(entities.JIGSAW_IMAGE).height
        
        gameOptions.DIMENSION.PIECE_WIDTH = jigsawImageWidth / gameOptions.JIGSAW.DIVISIONS
        gameOptions.DIMENSION.PIECE_HEIGHT = jigsawImageHeight / gameOptions.JIGSAW.DIVISIONS
        
        game.load.spritesheet(
            entities.JIGSAW_SPRITESHEET,
            urls.JIGSAW_IMAGE,
            gameOptions.DIMENSION.PIECE_WIDTH,
            gameOptions.DIMENSION.PIECE_HEIGHT
        )
    }
    
    function createJigsawPieces() {
        
        jigSawGroup = game.add.group()
        jigSawGroup.enableBody = true
        
        console.log(gameOptions.DIMENSION.WIDTH, (gameOptions.DIMENSION.PIECE_WIDTH * gameOptions.JIGSAW.DIVISIONS))
        
        const startingX = (gameOptions.DIMENSION.WIDTH - (gameOptions.DIMENSION.PIECE_WIDTH * gameOptions.JIGSAW.DIVISIONS)) / 2
        const startingY = (gameOptions.DIMENSION.HEIGHT - (gameOptions.DIMENSION.PIECE_HEIGHT * gameOptions.JIGSAW.DIVISIONS)) / 2

        const totalPieces = gameOptions.JIGSAW.DIVISIONS * gameOptions.JIGSAW.DIVISIONS
        
        for (let i = 0; i < totalPieces; i++) {
            
            const row = i % gameOptions.JIGSAW.DIVISIONS
            const column = (i - row) / gameOptions.JIGSAW.DIVISIONS
            
            const x = (row * gameOptions.DIMENSION.PIECE_WIDTH) + startingX
            const y = (column * gameOptions.DIMENSION.PIECE_HEIGHT) + startingY
            
            const sprite = game.add.sprite(x, y, entities.JIGSAW_SPRITESHEET, i, jigSawGroup)
            sprite.body.collideWorldBounds = true
            sprite.body.bounce.set(0.8)
        }
    }

    function preload() {
        
        game.load.image(entities.JIGSAW_IMAGE, urls.JIGSAW_IMAGE)
        
        game.load.onFileComplete.add((progress, cacheKey, success, totalLoaded, totalFiles) => {
            
            console.log(cacheKey)

            if (cacheKey === entities.JIGSAW_IMAGE) {
                createJigsawSpriteSheet()
            }
            
            if (cacheKey === entities.JIGSAW_SPRITESHEET) {
                createJigsawPieces()
            }
        }, this)
    }

    function create() {

        //  We're going to be using physics, so enable the Arcade Physics system
        game.physics.startSystem(Phaser.Physics.ARCADE)
    }

    function update() {
        
        if (gameOptions.DELAY > 0) {
            gameOptions.DELAY--
            return
        }
        
        for (const child of jigSawGroup.children) {
            
            const dirX = Math.random() < 0.5 ? -1 : 1
            const dirY = Math.random() < 0.5 ? -1 : 1

            child.body.acceleration.x = Math.random() * 500 * dirX
            child.body.acceleration.y = Math.random() * 500 * dirY
        }
    }

}
