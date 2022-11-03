//#region LoginScene
var login = new Phaser.Scene('LoginScene');

login.preload = function () {
  
    this.load.setBaseURL('/src/assets')

    this.load.image('loginBg', 'images/temp-login.png');
    this.load.html('loginForm', 'html/loginform.html');
  
};
  
login.create = function () {
    this.add.image(400, 260, 'loginBg');
    const loginForm = this.add.dom(392, 173).createFromCache('loginForm');

    loginForm.addListener('click');
    loginForm.on('click', function (event) {

        if (event.target.name === 'loginButton')
        {
            var inputUsername = loginForm.getChildByName('username');
            var inputPassword = loginForm.getChildByName('password');
            
            if (inputUsername.value !== '' && inputPassword.value!= '')
            {
                console.log(inputUsername.value);
                loginForm.removeListener('click');
                globalThis.socket = io();
                globalThis.socket.emit('login request', inputUsername.value, inputPassword.value);
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
};
//#endregion

//#region LoadingScene
var loading = new Phaser.Scene('LoadingScene');

loading.preload = function() {
    this.load.setBaseURL('/src/assets')
    this.load.atlas('loading', 'images/loading.png', 'images/loading.json');
    // this.load.atlas('loadBg', 'public/src/assets/images/loading.png', 'public/src/assets/images/loading.json');
}

loading.create = function() {
    const sprite = this.add.sprite(400, 260, 'loading', 'loading-0');
    const animConfig = {
        key: 'load',
        frames: 'loading',
        frameRate: 12,
        repeat: -1,
    };
    
    this.anims.create(animConfig);
    sprite.play('load');

    globalThis.socket.on('login success', (msg) => {
        console.log(msg);
    });

    globalThis.socket.on('login fail', () => {
        setTimeout(() => {
            this.scene.transition( {
                target: 'LoginScene',
                moveBelow: true
            });
        }, 1000);
    });
}
//#endregion


var config = {
    type: Phaser.AUTO,
    parent: 'app',
    width: 800,
    height: 520,
        dom: {
                createContainer: true
            },
    scene: [login, loading]
};

var game = new Phaser.Game(config);