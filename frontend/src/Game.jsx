import React, { useEffect } from 'react';
import Phaser from 'phaser';
import io from 'socket.io-client';

const Game = () => {
  useEffect(() => {
    const socket = io('http://localhost:3001');

    class MyGame extends Phaser.Scene {
      constructor() {
        super('MyGame');
        this.players = {};
        this.socket = socket;
      }

      preload() {
        this.load.image('player', 'https://labs.phaser.io/assets/sprites/mushroom2.png');
      }

      create() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.cameras.main.setBackgroundColor('#222');


        // ✅ AUDIO CONTEXT FIX HERE
        this.input.once('pointerdown', () => {
          if (this.sound.context.state === 'suspended') {
            this.sound.context.resume().then(() => {
              console.log('✅ AudioContext resumed');
            });
          }
        });

        // Handle existing players
        this.socket.on('currentPlayers', (players) => {
          Object.keys(players).forEach((id) => {
            if (id === this.socket.id) {
              this.addPlayer(players[id], true);
            } else {
              this.addPlayer(players[id], false);
            }
          });
        });

        // New player joins
        this.socket.on('newPlayer', (playerInfo) => {
            const sprite = this.add.sprite(playerInfo.x, playerInfo.y, 'player').setScale(0.2);

        });

        // Player movement
        this.socket.on('playerMoved', (playerInfo) => {
          const player = this.players[playerInfo.id];
          if (player) {
            player.setPosition(playerInfo.x, playerInfo.y);
          }
        });

        // Player disconnect
        this.socket.on('playerDisconnected', (id) => {
          if (this.players[id]) {
            this.players[id].destroy();
            delete this.players[id];
          }
        });
      }

      addPlayer(playerInfo, isSelf) {
        const sprite = this.add.sprite(playerInfo.x, playerInfo.y, 'player');
        sprite.setTint(isSelf ? 0x00ff00 : 0xff0000); // Green = self, red = others
        this.players[playerInfo.id] = sprite;
      }

      update() {
        const self = this.players[this.socket.id];
        if (!self || !this.cursors) return;

        let moved = false;
        const speed = 4;

        if (this.cursors.left.isDown) {
          self.x -= speed;
          moved = true;
        } else if (this.cursors.right.isDown) {
          self.x += speed;
          moved = true;
        }

        if (this.cursors.up.isDown) {
          self.y -= speed;
          moved = true;
        } else if (this.cursors.down.isDown) {
          self.y += speed;
          moved = true;
        }

        if (moved) {
          this.socket.emit('playerMovement', { x: self.x, y: self.y });
        }
      }
    }

    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'game-container',
      scene: MyGame,
      physics: { default: 'arcade' }
    };

    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true);
      socket.disconnect();
    };
  }, []);
  return <div id="game-container" style={{ width: '800px', height: '600px' }} />;

};

export default Game;
