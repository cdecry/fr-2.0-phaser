const localPlayer = null;

//#region LoginScene
var login = new Phaser.Scene('LoginScene');

login.preload = function () {
  
    this.load.setBaseURL('/src/assets')

    this.load.image('loginBg', 'scene/temp-login.png');
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
    this.load.atlas('loading', 'scene/loading.png', 'scene/loading.json');
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

    globalThis.socket.on('login success', () => {
        setTimeout(() => {
            this.scene.transition( {
                target: 'GameScene',
                moveBelow: true
            });
        }, 1000);
    });

    globalThis.socket.on('login fail', () => {
        setTimeout(() => {
            globalThis.socket.disconnect();
            this.scene.transition( {
                target: 'LoginScene',
                moveBelow: true
            });
        }, 1000);
    });
}
//#endregion

//#region GameScene
var inGame = new Phaser.Scene('GameScene');

inGame.preload = function() {
    this.load.setBaseURL('/src/assets')

    this.load.image('roomBg', 'scene/room-downtown.png');

    // load all avatar bases
    for (let i = 0; i < 6; i++) {
        this.load.spritesheet('body-' + i.toString(), 'avatar/body-' + i.toString() + '.png', { frameWidth: 58, frameHeight: 89 });
        this.load.image('face-' + i.toString(), 'avatar/face-' + i.toString() + '.png');
    }

    this.load.json('avatarAnims', 'avatar/avatarAnims.json');
}

inGame.create = function() {

    this.otherPlayers = this.add.group();

    function createPlayer(playerInfo) {
        console.log(JSON.stringify(playerInfo));
        inGame.player = inGame.add.sprite(400, 200, 'body-' +  playerInfo.avatar['skinTone']);
        inGame.container = inGame.add.container(playerInfo.x, playerInfo.y);
        inGame.container.setSize(58, 89);
        inGame.container.add(inGame.player);
    }

    function addOtherPlayers(playerInfo) {
        const otherPlayer = inGame.add.sprite(playerInfo.x, playerInfo.y, 'body-' + playerInfo.avatar['skinTone']);
        otherPlayer.id = playerInfo.id;
        inGame.otherPlayers.add(otherPlayer);
      }

    globalThis.socket.emit('game loaded');

    globalThis.socket.on('spawnCurrentPlayers', async (players) => {
        Object.keys(players).forEach(function (id) {
            if (players[id].id === globalThis.socket.id) {
                console.log('creating player ' + players[id].username);
                createPlayer(players[id]);
            } else {
                console.log('adding other players ' + JSON.stringify(players));
                addOtherPlayers(players[id]);
            }
          });
        console.log('Recieved msg from server: spawnCurrentPlayers');
    });
    globalThis.socket.on('newPlayer', function (player) {
        globalThis.addOtherPlayers(player);
    });

    // list of players in room
    const playersHere = [];
    const localPlayer = null;

    console.log('bonk');

    var bg = this.add.image(400, 260, 'roomBg');
    let data = this.cache.json.get('avatarAnims');
    
    data.skins.forEach(skin => {
        data.keys.forEach(key => {
            this.anims.create({
                key: skin + '-' + key,
                frames: this.anims.generateFrameNumbers(skin, { frames: data.frames[key] }),
                frameRate: data.frameRate,
                repeat: data.repeat
            });
        })
    });


    // EXAMPLE
    // var tempNamespace = {};
    // var myString = "crystal";

    // tempNamespace[myString] = this.add.sprite(400, 260, 'body-0');;

    // tempNamespace[myString].play('body-0-jump');

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
    pixelArt: true,
    scene: [login, loading, inGame]
};

var game = new Phaser.Game(config);