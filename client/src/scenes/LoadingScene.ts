import Phaser from 'phaser'
import { WIDTH, HEIGHT } from '../global'

export default class LoadingScene extends Phaser.Scene {
	constructor() {
		super('LoadingScene');
	}

    preload() {
        this.load.atlas('loading', './src/assets/images/loading.png', './src/assets/images/loading.json');
	}

    init() {
        this.preload();
        const sprite = this.add.sprite(WIDTH/2, HEIGHT/2, 'loading', 'loading-0');
    }

    
	create() {
        const sprite = this.add.sprite(WIDTH/2, HEIGHT/2, 'loading', 'loading-0');
        const animConfig = {
            key: 'load',
            frames: 'loading',
            frameRate: 12,
            repeat: -1,
        };
        this.anims.create(animConfig);
        sprite.play('load');

        setTimeout(() => {
            this.scene.transition( {
                target: 'GameScene',
                moveBelow: true
            });
        }, 5000);
    }
}
