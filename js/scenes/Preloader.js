// js/scenes/Preloader.js
class Preloader extends Phaser.Scene {
    constructor() { super('Preloader'); }

    preload() {
        // Display loading text/bar here...

        // Load assets using relative paths
        this.load.image('sky', 'assets/images/background_layer1.png'); // Example
        this.load.spritesheet('player', 'assets/images/player.png', { frameWidth: 32, frameHeight: 48 });
        this.load.image('bullet', 'assets/images/bullet.png');
        this.load.image('tiles', 'assets/images/tileset.png'); // Tileset image
        this.load.tilemapTiledJSON('map', 'assets/tilemaps/level1.json'); // Tilemap data
        // ... load all other assets (enemies, pickups, etc.)
    }

    create() {
        // Start the main game scene and the UI scene
        this.scene.start('GameScene');
        this.scene.launch('UIScene'); // Launch runs UIScene in parallel
    }
}
// Export if using modules: export default Preloader;
