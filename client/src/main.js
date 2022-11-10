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

var cursors;
var container;
var player = null;
var onlinePlayers = null;
var head, eyes;

var playerOffset = 0;
var headOffset = -5;
var eyesOffset = -28;

var inGame = new Phaser.Scene('GameScene');
inGame.preload = function() {
    this.load.setBaseURL('/src/assets')

    this.load.image('roomBg', 'scene/room-downtown.png');

    // load all avatar bases
    for (let i = 0; i < 6; i++) {
        this.load.spritesheet('body-' + i.toString(), 'avatar/body-' + i.toString() + '.png', { frameWidth: 58, frameHeight: 89 });
        this.load.image('face-' + i.toString(), 'avatar/face-' + i.toString() + '.png');
    }
    
    // load all avatar eyes
    for (let i = 0; i < 15; i++) {
        this.load.spritesheet('eyes-' + i.toString(), 'avatar/new-eyes-' + i.toString() + '.png', { frameWidth: 45, frameHeight: 48 });
    }

    this.load.json('avatarAnims', 'avatar/avatarAnims.json');
}

inGame.create = function() {

    key1 = inGame.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    cursors = this.input.keyboard.createCursorKeys();
    var otherPlayers = this.add.group();

    function createPlayer(playerInfo) {
        player = inGame.add.sprite(0, 0, 'body-' +  playerInfo.avatar['skinTone']);
        head = inGame.add.sprite(-5, -28, 'face-' +  playerInfo.avatar['skinTone']);
        eyes = inGame.add.sprite(-5, -28, 'eyes-' +  playerInfo.avatar['eyeType']);

        container = inGame.add.container(playerInfo.x, playerInfo.y);
        container.setSize(58, 89);
        container.add([head, eyes, player]);


        inGame.physics.add.existing(container, false);
        container.body.setCollideWorldBounds(true);

        container.setDataEnabled();
        container.setData('username', playerInfo.username);
        
        container.setData('skinTone', playerInfo.avatar['skinTone']);
    }

    function addOtherPlayers(playerInfo) {
        const otherPlayer = inGame.add.sprite(playerInfo.x, playerInfo.y, 'body-' + playerInfo.avatar['skinTone']);
        const otherHead = inGame.add.sprite(playerInfo.x - 5, playerInfo.y - 28, 'face-' + playerInfo.avatar['skinTone']);
        const otherEyes = inGame.add.sprite(playerInfo.x - 5, playerInfo.y - 28, 'eyes-' + playerInfo.avatar['eyeType']);

        otherPlayer.flipX = playerInfo.flipX;
        otherHead.flipX = playerInfo.flipX;
        otherEyes.flipX = playerInfo.flipX;

        if (playerInfo.flipX) {
            otherHead.setPosition(playerInfo.x + 5, playerInfo.y - 28);
            otherEyes.setPosition(playerInfo.x + 5, playerInfo.y - 28);
        }

        const otherContainer = inGame.add.container([otherHead, otherEyes, otherPlayer]);
        otherContainer.flipX = playerInfo.flipX;
        otherContainer.setDataEnabled();
        otherContainer.setData('username', playerInfo.username);
        otherContainer.setData('skinTone', playerInfo.skinTone);
        otherContainer.id = playerInfo.id;
        otherPlayers.add(otherContainer);
      }

    globalThis.socket.emit('game loaded');

    globalThis.socket.on('spawnCurrentPlayers', async (players) => {

        Object.keys(players).forEach(function (id) {

                if (players[id].id === globalThis.socket.id && player == null) {
                    console.log('creating player ' + players[id].username);
                    createPlayer(players[id]);
                    
                } else if (players[id].id != globalThis.socket.id) {
                    addOtherPlayers(players[id]);
                }
        });
        console.log('Recieved msg from server: spawnCurrentPlayers');
    });
    globalThis.socket.on('spawnNewPlayer', function (p) {
        addOtherPlayers(p);
    });

    globalThis.socket.on('removePlayer', function (id) {

        for (let i = 0; i < otherPlayers.getLength(); i++) {
            console.log(JSON.stringify(otherPlayers.getChildren()[i]));
            var p = otherPlayers.getChildren()[i];

            console.log('otherplayer id: ' + p.getData('username'));
            console.log('id, pid' + id + ',' + p.id);
            if (id === p.id) {
                for (let j = 0; j < 3; j++) {
                    p.x[j].destroy();
                    p.y[j].destroy();
                }
                p.destroy();
                otherPlayers.remove(p);
            }
        }
        otherPlayers.getChildren().forEach(function (p) {
            
        });
      });

    // list of players in room

    var bg = this.add.image(400, 260, 'roomBg');

    globalThis.socket.on('playerMoved', function (playerInfo) {
        if (playerInfo.id !== globalThis.socket.id) {

            otherPlayers.getChildren().forEach(function (p) {
            if (playerInfo.id === p.id) {
                p.flipX = playerInfo.flipX;

                for (let i = 0; i < 3; i++) {
                    p.x[i].flipX = p.flipX;
                }

                p.x[0].setPosition(playerInfo.x - 5, playerInfo.y - 28);
                p.x[1].setPosition(playerInfo.x - 5, playerInfo.y - 28);


                if (p.flipX) {
                    p.x[0].setPosition(playerInfo.x + 5, playerInfo.y - 28);
                    p.x[1].setPosition(playerInfo.x + 5, playerInfo.y - 28);
                }

                p.x[2].setPosition(playerInfo.x, playerInfo.y);
            }
            }.bind(this));
        }
    }.bind(this));

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


function moveX(currentPosX, currentPosY, direction) {
	var tween = inGame.tweens.add({
        targets: container,
        x: currentPosX + direction*70,
        y: currentPosY,
        ease: 'Linear',
        duration: 500,
    });
}

function moveY(currentPosX, currentPosY, direction) {
	var tween = inGame.tweens.add({
        targets: container,
        x: currentPosX,
        y: currentPosY + direction*70,
        ease: 'Linear',
        duration: 500,
    });
}

inGame.update = function() {
    if (container) {

        // Horizontal movement
        if (cursors.left.isDown) {
            moveX(container.x, container.y, -1);

        } else if (cursors.right.isDown) {
            moveX(container.x, container.y, 1);
        }
        // Vertical movement
        if (cursors.up.isDown) {
            moveY(container.x, container.y, -1);

        } else if (cursors.down.isDown) {
            moveY(container.x, container.y, 1);
        }

        if (cursors.left.isDown) {
            player.flipX = false;
            // container.setScale(1, 1);
            head.flipX = false;
            head.setPosition(-5, -28);
            eyes.flipX = false;
            eyes.setPosition(-5, -28);

        } else if (cursors.right.isDown) {
            player.flipX = true;
            // container.setScale(-1, 1);
            head.flipX = true;
            eyes.flipX = true;
            head.setPosition(5, -28);
            eyes.setPosition(5, -28);
        }

        if (key1.isDown) {
            player.play('body-' + container.getData('skinTone') + '-wave');
        }

        // emit player movement
        var x = container.x;
        var y = container.y;
        var flipX = player.flipX;
        
        if (container.oldPosition && (x !== container.oldPosition.x || y !== container.oldPosition.y || flipX !== container.oldPosition.flipX)) {
            globalThis.socket.emit('playerMovement', { x, y, flipX });
        }

        // save old position data
        container.oldPosition = {
            x: container.x,
            y: container.y,
            flipX: player.flipX
        };
    }
}


//#endregion

var config = {
    type: Phaser.AUTO,
    parent: 'app',
    width: 800,
    height: 520,
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    dom: {
        createContainer: true
        },
    pixelArt: true,
    scene: [login, loading, inGame]
};

var game = new Phaser.Game(config);