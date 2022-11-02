import Phaser from 'phaser'

import { WIDTH, HEIGHT } from './global'
import LoadingScene from './scenes/LoadingScene'
import LoginScene from './scenes/LoginScene'
import GameScene from './scenes/GameScene'

const config = {
	type: Phaser.AUTO,
	parent: 'app',
	width: WIDTH,
	height: HEIGHT,
    dom: {
        createContainer: true
    },
	scene: [LoginScene, LoadingScene, GameScene],
}

export default new Phaser.Game(config)
