'use strict'

/* global Phaser */

window.onload = phase

function phase() {
    

    const gameOptions = {
        DELAY: 90,
        
        DIMENSION: {
            WIDTH: 1200,
            HEIGHT: 700
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
        Phaser.AUTO, 
        '',
        {
            preload: preload,
            create: create,
            update: update
        }
    )
    
    const urls = {
        JIGSAW_IMAGE: 'assets/shadow-mordor-HD-wallpaper.jpg'
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
    
    const loadNext = {
        [entities.JIGSAW_IMAGE]: loadJigsawSpriteSheet,
        [entities.JIGSAW_SPRITESHEET]: loadJigsawPieces
    }
    
    let jigsawSprite
    let jigSawGroup
    
    function delay() {
        
        /*
            At a framerate of 60, this gives 1.5 seconds of delay. Think of it as a sort of splash screen. Of course, 
            we'll have to get a realsplash screen when it becomes a proper game.
        */
        if (gameOptions.DELAY > 0) {
            gameOptions.DELAY--
            return
        }
    }
    
    function loadJigsawSpriteSheet() {
        
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
    
    function loadJigsawPieces() {
        
        jigSawGroup = game.add.group()
        jigSawGroup.enableBody = true
        
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
        
        /*
            Since the strings in the entity objects act as indices to the cache, we can also use them here to check if 
            a specific entity has finished loading by putting a callback against the `fileComplete` event. This also 
            lets us chain loading of assets. We can load an image firts, wait for its `fileComplete` even, then queue 
            the loading of a spritesheet created from this image.
            
            As long as there are items in the queue, the `create` function won't be called.
        */
        game.load.onFileComplete.add((progress, cacheKey, success, totalLoaded, totalFiles) => {
            
            /*
                Quite simple and ingenious, if I may say so myself. I have just defined for myself a custom loading 
                order. Each time one of the entities finishes loading, I just call the function to load the next entity 
                dependent on this. This doesn't allow me to add multiple parallel dependencies, but we can easily fix 
                that in the future.
            */
            if (loadNext[cacheKey]) {
                loadNext[cacheKey]()
            }
        }, this)
    }
    
    function enableInput() {
        
        /*
            So let's iterate through each of the jigsaw pieces and enable input on them. Not just that, we enable drag
            too. That first param makes sure that on clicking, the piece gets centered on the mouse, and the second
            ensures that the piece comes up to the top. Easier for folks to see it, that way.
        */
        for (const jigsawPiece of jigSawGroup.children) {
            jigsawPiece.inputEnabled = true
            jigsawPiece.input.enableDrag(false, true)
        }
    }

    function create() {

        //  We're going to be using physics, so enable the Arcade Physics system.
        game.physics.startSystem(Phaser.Physics.ARCADE)
        
        // Let's enable input for all the things we need input for.
        enableInput()
        console.log(game.input.mousePointer)
    }
    
    function moveRandomly() {
        
        /*
            Let's do this: let's go through all the children of the jigsaw group, (so, essentially, all the jigsaw 
            pieces), and move them in a random x and a random y direction. We'll be applying acceleration to them, 
            randomly, so it won't be a jerky movement. Applying velocity directly, now that would be chaos.
        */
        for (const jigsawPiece of jigSawGroup.children) {
            
            /*
                If the pointer is currently over the given puzzle piece, let's stop it's movement completely and then
                not do anything to it. It's frozen in place.
            */
            if (jigsawPiece.input.pointerOver()) {
                
                jigsawPiece.body.velocity.x = 0
                jigsawPiece.body.velocity.y = 0
                continue
            }
            
            /*
                Pretty even chance of either direction being picked.
            */
            const dirX = Math.random() < 0.5 ? -1 : 1
            const dirY = Math.random() < 0.5 ? -1 : 1

            /*
                And then it's all about picking a random acceleration, scaling it up to 500, and picking a direction 
                by using previous values.
            */
            jigsawPiece.body.acceleration.x += Math.random() * 15 * dirX
            jigsawPiece.body.acceleration.y += Math.random() * 15 * dirY
        }
    }

    function update() {
        
        delay()
        moveRandomly()
        
        // Now let's do input.
        input()
    }
    
    function input() {
        
    }

}
