import React, { useEffect } from 'react';
import Phaser from 'phaser';
import io from 'socket.io-client';

const Game = () => {
  useEffect(() => {
    const socket = io('http://localhost:3001'); // Make sure server is running

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
        // Debug confirm scene created
        console.log('✅ Phaser scene started');

        this.cameras.main.setBackgroundColor('#222');
        this.cursors = this.input.keyboard.createCursorKeys();

        // ✅ Audio fix
        this.input.once('pointerdown', () => {
          if (this.sound.context.state === 'suspended') {
            this.sound.context.resume().then(() => {
              console.log('✅ AudioContext resumed');
            });
          }
        });

        this.socket.on('connect', () => {
            this.playerId = this.socket.id;
          });
          

        // Just for debugging: show a test player sprite
        this.testPlayer = this.add.sprite(400, 300, 'player').setScale(1.2);

        // Socket: current players
        this.socket.on('currentPlayers', (players) => {
          Object.keys(players).forEach((id) => {
            this.addPlayer(players[id], id === this.socket.id);
          });
        });

        this.socket.on('newPlayer', (playerInfo) => {
          this.addPlayer(playerInfo, false);
        });

        this.socket.on('playerMoved', (playerInfo) => {
          const player = this.players[playerInfo.id];
          if (player) player.setPosition(playerInfo.x, playerInfo.y);
        });

        this.socket.on('playerDisconnected', (id) => {
          if (this.players[id]) {
            this.players[id].destroy();
            delete this.players[id];
          }
        });
      }

      addPlayer(playerInfo, isSelf) {
        const sprite = this.add.sprite(playerInfo.x, playerInfo.y, 'player');
        sprite.setTint(isSelf ? 0x00ff00 : 0xff0000);
        this.players[playerInfo.id] = sprite;
      }

      update() {
        if (!this.testPlayer || !this.cursors) return;
      
        let moved = false;
        const speed = 4;
      
        if (this.cursors.left.isDown) {
          this.testPlayer.x -= speed;
          moved = true;
        } else if (this.cursors.right.isDown) {
          this.testPlayer.x += speed;
          moved = true;
        }
      
        if (this.cursors.up.isDown) {
          this.testPlayer.y -= speed;
          moved = true;
        } else if (this.cursors.down.isDown) {
          this.testPlayer.y += speed;
          moved = true;
        }
      
        // No need to emit anything to server for testPlayer
      }
    }
      

    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'game-container',
      scene: MyGame,
      physics: { default: 'arcade' },
      backgroundColor: '#222'
    };

    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true);
      socket.disconnect();
    };
  }, []);

  return <div id="game-container" style={{ width: '800px', height: '600px', margin: '0 auto' }} />;
};

export default Game;
