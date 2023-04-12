import Phaser from 'phaser'
import { WIDTH, HEIGHT } from '../global'

export default class LoginScene extends Phaser.Scene {
	constructor() {
		super('LoginScene');
	}

	preload() {
		this.load.setBaseURL('./src/assets')

		this.load.image('loginBg', 'images/temp-login.png');
        this.load.html('loginForm', 'html/loginform.html');
	}

	create() {
		this.add.image(WIDTH/2, HEIGHT/2, 'loginBg');
        const loginForm = this.add.dom(392, 173).createFromCache('loginForm');

        loginForm.addListener('click');

        loginForm.on('click', function (event) {

            if (event.target.name === 'loginButton')
            {
                var inputUsername = <HTMLInputElement>loginForm.getChildByName('username');
                var inputPassword = <HTMLInputElement>loginForm.getChildByName('password');
                
                if (inputUsername.value !== '' && inputPassword.value!= '')
                {
                    console.log(inputUsername.value);
                    loginForm.removeListener('click');
                    load();
                }
                else {
                    alert('Please enter your login information.');
                }
            }
        });

        const load = () => {
            this.scene.transition( {
                target: 'LoadingScene',
                moveBelow: true
            });
        }

    }
    getChildByName(arg0: string) {
        throw new Error('Method not implemented.');
    }
}
