import io from 'socket.io-client';
import Phaser from 'phaser'
import { WIDTH, HEIGHT } from '../global'

export default class GameScene extends Phaser.Scene {
    socket: any;
	constructor() {
		super('GameScene');
	}

	preload() {
		this.load.setBaseURL('./src/assets')

		this.load.image('logo', 'images/fantage-logo.png');
	}

	create() {
        this.socket = io();
		this.add.image(WIDTH/2, HEIGHT/2, 'logo');
        this.socket = io('http://localhost:3000');

        this.socket.on('connect', function () {
        	console.log('Connected!');
        });
    }
}
