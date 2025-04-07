// js/main.js

// Import scenes if using modules, otherwise ensure they are loaded via <script> tags first
// import Preloader from './scenes/Preloader.js';
// import GameScene from './scenes/GameScene.js';
// import UIScene from './scenes/UIScene.js';

const config = {
    type: Phaser.AUTO, // Automatically choose WebGL or Canvas
    // Example 21:9 aspect ratio (adjust as needed)
    width: 1120,
    height: 480,
    parent: 'game-container', // ID of the div to contain the canvas
    pixelArt: true, // Essential for crisp pixel art
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 }, // Adjust gravity to feel right
            // debug: true // Set true during development to see physics bodies
        }
    },
    scene: [Preloader, GameScene, UIScene] // Order matters: Preloader runs first
};

const game = new Phaser.Game(config);
