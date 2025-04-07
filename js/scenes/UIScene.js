// js/scenes/UIScene.js

class UIScene extends Phaser.Scene {
    constructor() {
        // Register scene with key 'UIScene'
        // Note: No 'active: true' here, we launch it from Preloader
        super('UIScene');

        // Variables to hold the text objects
        this.healthText = null;
        this.ammoText = null;
        this.scoreText = null;
        // Add variables for objective text if needed
        // this.objectiveText = null;
    }

    create() {
        console.log("UIScene: Creating UI...");

        // --- Define text style ---
        const textStyle = {
            fontSize: '18px',
            fontFamily: '"Courier New", Courier, monospace', // Use a monospaced font for retro feel
            fill: '#ffffff', // White text
            align: 'left'
        };

        // --- Create Text Elements ---
        // Position elements in the top-left corner (adjust coordinates as needed)
        this.healthText = this.add.text(10, 10, 'HEALTH: 100', textStyle);
        this.ammoText = this.add.text(10, 30, 'AMMO: 150', textStyle);
        this.scoreText = this.add.text(10, 50, 'SCORE: 0', textStyle);
        // Create objective text element
        // this.objectiveText = this.add.text(10, 70, 'OBJECTIVE: Find Keycard', textStyle);

        // --- IMPORTANT: Set Scroll Factor to 0 ---
        // This makes the UI elements stay fixed on the screen and not move with the camera
        this.healthText.setScrollFactor(0);
        this.ammoText.setScrollFactor(0);
        this.scoreText.setScrollFactor(0);
        // this.objectiveText.setScrollFactor(0);


        // --- Listen for Events from GameScene ---
        // Get a reference to the GameScene that is running in parallel
        const gameScene = this.scene.get('GameScene');

        // When the 'updateHealth' event is emitted by GameScene, call our updateHealthDisplay function
        gameScene.events.on('updateHealth', this.updateHealthDisplay, this);
        // Same for ammo and score
        gameScene.events.on('updateAmmo', this.updateAmmoDisplay, this);
        gameScene.events.on('updateScore', this.updateScoreDisplay, this);
        // Listen for objective updates
        // gameScene.events.on('updateObjective', this.updateObjectiveDisplay, this);


        console.log("UIScene: UI Created and Listeners Set Up.");
    }

    // --- Handler Functions for UI Updates ---

    updateHealthDisplay(health) {
        if (this.healthText) { // Check if text object exists
             this.healthText.setText('HEALTH: ' + health);
        }
    }

    updateAmmoDisplay(ammo) {
         if (this.ammoText) {
            this.ammoText.setText('AMMO: ' + ammo);
         }
    }

    updateScoreDisplay(score) {
         if (this.scoreText) {
            this.scoreText.setText('SCORE: ' + score);
         }
    }

    // updateObjectiveDisplay(objectiveString) {
    //      if (this.objectiveText) {
    //         this.objectiveText.setText('OBJECTIVE: ' + objectiveString);
    //      }
    // }

} // End of UIScene Class
