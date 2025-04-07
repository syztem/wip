// js/scenes/GameScene.js

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');

        // Initialize variables to hold game objects and state
        this.player = null;
        this.cursors = null;
        this.shootKey = null;
        this.jumpKey = null; // Using SPACE for jump now
        this.map = null;
        this.groundLayer = null; // Layer(s) player collides with
        this.pickups = null; // Group for pickup items
        this.enemies = null; // Group for enemies
        this.bullets = null; // Group for player bullets

        // Game state variables
        this.playerHealth = 100;
        this.playerAmmo = 150; // Starting ammo
        this.score = 0;
        this.shootCooldown = 0;
        this.invulnerableTimer = 0; // Timer for player invulnerability after hit
        this.jumpCooldownTimer = 0; // Timer to prevent instant double-jumps

        // Constants (adjust these to tune gameplay)
        this.PLAYER_SPEED = 200; // Pixels per second
        this.JUMP_VELOCITY = -450; // Negative Y velocity for jump
        this.BULLET_SPEED = 400;
        this.SHOOT_COOLDOWN_TIME = 200; // Milliseconds between shots
        this.INVULNERABLE_DURATION = 1000; // Milliseconds of invulnerability
        this.JUMP_COOLDOWN_TIME = 100; // Milliseconds between allowed jumps
    }

    create() {
        console.log("GameScene: Creating scene...");

        // --- Create Tilemap ---
        this.map = this.make.tilemap({ key: 'map' });
        // Add the tileset image to the map ('tilesetInTiled' must match the name you gave the tileset in Tiled)
        const tileset = this.map.addTilesetImage('YourTilesetNameInTiled', 'tiles'); // IMPORTANT: Replace 'YourTilesetNameInTiled'

        // Create layers based on layer names in Tiled
        // Add background layers first if any (setScrollFactor for parallax)
        // const backgroundLayer = this.map.createLayer('BackgroundLayerName', tileset, 0, 0);
        // backgroundLayer.setScrollFactor(0.5); // Example parallax

        // Create the ground/platform layer(s)
        this.groundLayer = this.map.createLayer('GroundLayerNameInTiled', tileset, 0, 0); // IMPORTANT: Replace 'GroundLayerNameInTiled'

        // Enable collision on the ground layer based on a custom property set in Tiled
        // In Tiled, select your tileset, click 'Edit Tileset', select tiles, add a custom boolean property named 'collides', set it to true.
        this.groundLayer.setCollisionByProperty({ collides: true });

        // --- Create Player ---
        // Find player spawn point from Tiled's object layer
        const spawnPoint = this.map.findObject("ObjectLayerNameInTiled", obj => obj.name === "PlayerSpawn"); // IMPORTANT: Replace Layer & Object Name

        this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, 'player');
        this.player.setBounce(0.1); // Slight bounce on landing
        this.player.setCollideWorldBounds(false); // We'll use map bounds instead if needed

        // --- Create Player Animations (Example) ---
        this.anims.create({
            key: 'player_idle',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }), // Adjust frame numbers
            frameRate: 5,
            repeat: -1
        });
        this.anims.create({
            key: 'player_run',
            frames: this.anims.generateFrameNumbers('player', { start: 1, end: 4 }), // Adjust frame numbers
            frameRate: 10,
            repeat: -1
        });
         this.anims.create({
            key: 'player_jump',
            frames: this.anims.generateFrameNumbers('player', { start: 5, end: 5 }), // Adjust frame numbers
            frameRate: 10,
            repeat: -1
        });
        // Add more animations (shoot, hurt) as needed

        // --- Create Groups ---
        this.bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 30 // Limit number of bullets on screen
        });
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();

        // --- Populate Enemies & Pickups from Tiled ---
        // Find objects in Tiled's object layer and create corresponding sprites
        const objectLayer = this.map.getObjectLayer('ObjectLayerNameInTiled'); // IMPORTANT: Replace Layer Name
        objectLayer.objects.forEach(obj => {
            // Use obj.type or obj.name to determine what to spawn
            if (obj.type === 'imp_spawn') {
                let enemy = this.enemies.create(obj.x, obj.y, 'imp');
                // enemy.setData('health', 20); // Store enemy specific data
                // enemy.setData('damage', 10);
                // Add basic enemy properties if needed (e.g., movement range)
            } else if (obj.type === 'demon_spawn') {
                 let enemy = this.enemies.create(obj.x, obj.y, 'demon');
                 // enemy.setData('health', 50);
                 // enemy.setData('damage', 20);
            } else if (obj.type === 'cyberdemon_spawn') {
                 let enemy = this.enemies.create(obj.x, obj.y, 'cyberdemon');
                 // enemy.setData('health', 300);
                 // enemy.setData('damage', 30);
                 // enemy.body.setSize(80, 80); // Adjust physics body if sprite is large
            } else if (obj.type === 'health_pickup') {
                let pickup = this.pickups.create(obj.x, obj.y, 'health_pickup');
                pickup.setData('type', 'health');
                pickup.setData('value', 25);
            } else if (obj.type === 'ammo_pickup') {
                let pickup = this.pickups.create(obj.x, obj.y, 'ammo_pickup');
                pickup.setData('type', 'ammo');
                pickup.setData('value', 15);
            }
            // Add objective items similarly
            // else if (obj.type === 'keycard_objective') { ... }
        });
        // Make pickups static so they don't fall
        this.pickups.children.iterate(pickup => {
             if (pickup) {
                pickup.body.setAllowGravity(false);
                pickup.body.setImmovable(true);
             }
        });
         // Basic AI setup for enemies (can be more complex)
        this.enemies.children.iterate(enemy => {
             if (enemy) {
                 // Add basic enemy properties if needed
                 enemy.setCollideWorldBounds(true); // Keep them within map bounds for now
                 // Add animations for enemies here...
             }
        });


        // --- Setup Physics Collisions & Overlaps ---
        this.physics.add.collider(this.player, this.groundLayer);
        this.physics.add.collider(this.enemies, this.groundLayer);
        this.physics.add.collider(this.enemies, this.enemies); // Enemies collide with each other

        // Player collects pickups
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);

        // Bullets hit enemies
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);

        // Player touches enemy
        this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, null, this);

        // --- Setup Camera ---
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1); // Smooth follow
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        // Optional: Set deadzone so camera only moves when player is near edge
        // this.cameras.main.setDeadzone(this.cameras.main.width * 0.25, this.cameras.main.height * 0.5);

        // --- Setup Input ---
        this.cursors = this.input.keyboard.createCursorKeys(); // Arrow keys (or WASD setup needed)
        this.shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); // Use SPACE for jump

        // --- Initial UI Update ---
        this.updateUIDisplay();

        console.log("GameScene: Creation complete.");
    }

    update(time, delta) {
        // --- Handle Player Movement ---
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-this.PLAYER_SPEED);
            this.player.flipX = true; // Face left
            if (this.player.body.onFloor()) {
                this.player.anims.play('player_run', true);
            }
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(this.PLAYER_SPEED);
            this.player.flipX = false; // Face right
            if (this.player.body.onFloor()) {
                this.player.anims.play('player_run', true);
            }
        } else {
            this.player.setVelocityX(0);
            if (this.player.body.onFloor()) {
                this.player.anims.play('player_idle', true);
            }
        }

        // --- Handle Player Jumping ---
        // Allow jump if SPACE is pressed, player is on floor, and cooldown is over
         if (Phaser.Input.Keyboard.JustDown(this.jumpKey) && this.player.body.onFloor() && time > this.jumpCooldownTimer) {
            this.player.setVelocityY(this.JUMP_VELOCITY);
            this.jumpCooldownTimer = time + this.JUMP_COOLDOWN_TIME; // Set next allowed jump time
            // Play jump sound if added: this.sound.play('jump_sfx');
        }

        // Update jump animation if player is in the air
        if (!this.player.body.onFloor()) {
            this.player.anims.play('player_jump', true); // Or specific falling animation
        }

        // --- Handle Player Shooting ---
        if (Phaser.Input.Keyboard.JustDown(this.shootKey) && this.playerAmmo > 0 && time > this.shootCooldown) {
            this.shootBullet(time);
            // Play shoot sound if added: this.sound.play('shoot_sfx');
        }

        // --- Enemy AI (Very Basic Example) ---
        this.enemies.children.iterate(enemy => {
             if (enemy && enemy.active) {
                // Simple back-and-forth or follow player logic can go here
                // Example: If player is close, move towards player
                if (Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) < 300) {
                    this.physics.moveToObject(enemy, this.player, 50); // Speed 50
                } else {
                     // Basic patrol (needs more logic for direction changes)
                    // enemy.setVelocityX(50);
                }
             }
        });


        // --- Bullet Management ---
        this.bullets.children.iterate(bullet => {
            if (bullet && bullet.active) {
                // Remove bullets that go too far off screen
                if (bullet.x < this.cameras.main.scrollX - bullet.width || bullet.x > this.cameras.main.scrollX + this.cameras.main.width + bullet.width) {
                    this.bullets.killAndHide(bullet);
                    bullet.body.stop(); // Stop physics simulation
                }
            }
        });

        // --- Handle Player Invulnerability ---
        if (this.invulnerableTimer > time) {
            // Flash player sprite while invulnerable
            this.player.setVisible(Math.floor(time / 100) % 2 === 0);
        } else {
            this.player.setVisible(true); // Ensure player is visible when not invulnerable
        }

        // --- Check Game Over ---
        // If player falls off the map (adjust Y threshold as needed)
        if (this.player.y > this.map.heightInPixels + 100) {
             this.gameOver();
        }
    } // End of update()

    shootBullet(time) {
        let bullet = this.bullets.get(this.player.x, this.player.y);

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.body.setAllowGravity(false); // Bullets fly straight

            // Adjust bullet starting position based on player direction
            let startX = this.player.flipX ? this.player.x - this.player.width / 2 : this.player.x + this.player.width / 2;
            let startY = this.player.y; // Adjust Y pos if needed (e.g., gun barrel height)
            bullet.setPosition(startX, startY);

            // Set bullet velocity based on player direction
            let velocityX = this.player.flipX ? -this.BULLET_SPEED : this.BULLET_SPEED;
            bullet.setVelocity(velocityX, 0);

            // Update game state
            this.playerAmmo--;
            this.shootCooldown = time + this.SHOOT_COOLDOWN_TIME; // Set next allowed shot time
            this.updateUIDisplay(); // Update ammo count immediately
        }
    }

    collectPickup(player, pickup) {
        if (!pickup.active) return; // Already collected

        const type = pickup.getData('type');
        const value = pickup.getData('value');

        if (type === 'health') {
            this.playerHealth = Phaser.Math.Clamp(this.playerHealth + value, 0, 100); // Clamp health between 0 and 100
        } else if (type === 'ammo') {
            this.playerAmmo += value;
        }
        // Add objective item collection logic here

        // Play pickup sound if added: this.sound.play('pickup_sfx');

        pickup.disableBody(true, true); // Deactivate and hide the pickup
        this.updateUIDisplay(); // Update UI
    }

    bulletHitEnemy(bullet, enemy) {
        if (!bullet.active || !enemy.active) return; // Already hit or inactive

        // Deactivate the bullet
        this.bullets.killAndHide(bullet);
        bullet.body.stop();

        // Apply damage to enemy (requires storing health on the enemy)
        let enemyHealth = enemy.getData('health') || 10; // Get health or default
        enemyHealth -= 10; // Bullet damage
        enemy.setData('health', enemyHealth);

        // Play enemy hit sound if added: this.sound.play('enemy_hit_sfx');

        // Flash enemy or show hit effect
        enemy.setTint(0xff0000); // Tint red
        this.time.delayedCall(100, () => { enemy.clearTint(); }); // Remove tint after delay

        if (enemyHealth <= 0) {
            // Enemy defeated
            enemy.disableBody(true, true); // Deactivate and hide
            this.score += 100; // Increase score (adjust based on enemy type)
            // Spawn explosion animation if added
            // Add chance to drop pickup
            this.updateUIDisplay(); // Update score
        }
    }

    playerHitEnemy(player, enemy) {
        // Check if player is currently invulnerable
        if (this.time.now < this.invulnerableTimer) {
            return; // Player can't be hurt yet
        }
        if (!enemy.active) return; // Don't get hurt by inactive enemies

        const damage = enemy.getData('damage') || 10; // Get enemy damage or default
        this.playerHealth -= damage;
        this.playerHealth = Phaser.Math.Clamp(this.playerHealth, 0, 100);

        // Make player invulnerable for a short time
        this.invulnerableTimer = this.time.now + this.INVULNERABLE_DURATION;

        // Apply knockback effect to player
        let knockbackX = player.x < enemy.x ? -100 : 100;
        let knockbackY = -150;
        player.setVelocity(knockbackX, knockbackY);

        // Play player hurt sound/effect

        this.updateUIDisplay(); // Update health display

        if (this.playerHealth <= 0) {
            this.gameOver();
        }
    }

    updateUIDisplay() {
        // Emit events to the UIScene to update the display
        // The UIScene listens for these events
        this.events.emit('updateHealth', this.playerHealth);
        this.events.emit('updateAmmo', this.playerAmmo);
        this.events.emit('updateScore', this.score);
        // Emit objective updates here...
    }

    gameOver() {
        console.log("Game Over!");
        this.physics.pause(); // Stop physics
        this.player.setTint(0xff0000); // Turn player red
        this.player.anims.stop(); // Stop animations
        // Optionally, show a Game Over message via the UI scene or restart the scene
        // this.scene.restart();
        this.cameras.main.fade(500, 0,0,0); // Fade out
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Can transition to a dedicated GameOver scene or restart
            this.scene.restart();
        });
    }

    // Add functions for objective completion checks and winning the game
    // checkWinCondition() { ... }
    // winGame() { ... }

} // End of GameScene Class
