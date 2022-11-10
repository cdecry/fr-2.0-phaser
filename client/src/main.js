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
var globalPointer = {
    x: 0,
    y: 0,
}

var clickOffsetY = 80;

var container;
var player = null;
var head, eyes;


var inGame = new Phaser.Scene('GameScene');
inGame.preload = function() {
    this.load.setBaseURL('/src/assets')

    this.load.image('roomBg', 'scene/room-downtown.png');

    // load all avatar bases
    for (let i = 0; i < 6; i++) {
        this.load.spritesheet('body-' + i.toString(), 'avatar/body-' + i.toString() + '.png', { frameWidth: 80, frameHeight: 117 });
        this.load.image('face-' + i.toString(), 'avatar/face-' + i.toString() + '.png');
    }
    
    // load all avatar eyes
    for (let i = 0; i < 14; i++) {
        this.load.spritesheet('eyes-' + i.toString(), 'avatar/eyes-' + i.toString() + '.png', { frameWidth: 80, frameHeight: 117 });
    }

    this.load.json('avatarAnims', 'avatar/avatarAnims.json');
}

inGame.create = function() {

    var bg = this.add.image(400, 260, 'roomBg');
    var otherPlayers = this.add.group();
    let data = this.cache.json.get('avatarAnims');

    key1 = inGame.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    cursors = this.input.keyboard.createCursorKeys();
    
    function createPlayer(playerInfo) {
        player = inGame.add.sprite(0, 0, 'body-' +  playerInfo.avatar['skinTone']);
        head = inGame.add.sprite(0, 0, 'face-' +  playerInfo.avatar['skinTone']);
        eyes = inGame.add.sprite(0, 0, 'eyes-' +  playerInfo.avatar['eyeType']);

        container = inGame.add.container(playerInfo.x, playerInfo.y);
        container.setSize(80, 117);
        container.add([head, eyes, player]);


        inGame.physics.add.existing(container, false);
        container.body.setCollideWorldBounds(true);

        container.setDataEnabled();
        container.setData('username', playerInfo.username);
        
        container.setData('skinTone', playerInfo.avatar['skinTone']);
    }

    function addOtherPlayers(playerInfo) {
        const otherPlayer = inGame.add.sprite(playerInfo.x, playerInfo.y, 'body-' + playerInfo.avatar['skinTone']);
        const otherHead = inGame.add.sprite(playerInfo.x, playerInfo.y, 'face-' + playerInfo.avatar['skinTone']);
        const otherEyes = inGame.add.sprite(playerInfo.x, playerInfo.y, 'eyes-' + playerInfo.avatar['eyeType']);

        otherPlayer.flipX = playerInfo.flipX;
        otherHead.flipX = playerInfo.flipX;
        otherEyes.flipX = playerInfo.flipX;

        if (playerInfo.flipX) {
            otherHead.setPosition(playerInfo.x, playerInfo.y);
            otherEyes.setPosition(playerInfo.x, playerInfo.y);
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
      });

    globalThis.socket.on('playerMoved', function (playerInfo) {
        if (playerInfo.id !== globalThis.socket.id) {

            otherPlayers.getChildren().forEach(function (p) {
            if (playerInfo.id === p.id) {
                p.flipX = playerInfo.flipX;

                for (let i = 0; i < 3; i++) {
                    p.x[i].flipX = p.flipX;
                }

                p.x[0].setPosition(playerInfo.x, playerInfo.y);
                p.x[1].setPosition(playerInfo.x, playerInfo.y);


                if (p.flipX) {
                    p.x[0].setPosition(playerInfo.x, playerInfo.y);
                    p.x[1].setPosition(playerInfo.x, playerInfo.y);
                }

                p.x[2].setPosition(playerInfo.x, playerInfo.y);
            }
            }.bind(this));
        }
    }.bind(this));
    
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

    this.input.on('pointerdown', function (pointer) {
        globalPointer.x = pointer.x;
        globalPointer.y = pointer.y;
        inGame.physics.moveTo(container, pointer.x, pointer.y - clickOffsetY, 150);
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
        duration: 600,
    });
}

function moveY(currentPosX, currentPosY, direction) {
	var tween = inGame.tweens.add({
        targets: container,
        x: currentPosX,
        y: currentPosY + direction*70,
        ease: 'Linear',
        duration: 600,
    });
}

function moveXY(newPosX, newPosY) {
	var tween = inGame.tweens.add({
        targets: container,
        x: newPosX,
        y: newPosY,
        ease: 'Linear',
    });
}

inGame.update = function() {
    if (container) {

        //#region Arrow Key Movement
        // Horizontal movement
        if (cursors.left.isDown) {
            container.body.setVelocity(0);
            moveX(container.x, container.y, -1);

        } else if (cursors.right.isDown) {
            container.body.setVelocity(0);
            moveX(container.x, container.y, 1);
        }

        // Vertical movement
        if (cursors.up.isDown) {
            container.body.setVelocity(0);
            moveY(container.x, container.y, -1);

        } else if (cursors.down.isDown) {
            container.body.setVelocity(0);
            moveY(container.x, container.y, 1);
        }

        // Flip
        if (cursors.left.isDown || container.body.velocity.x < 0) {
            player.flipX = false;
            head.flipX = false;
            eyes.flipX = false;

        } else if (cursors.right.isDown || container.body.velocity.x > 0) {
            player.flipX = true;
            head.flipX = true;
            eyes.flipX = true;
        }
        //#endregion


        // Click Movement
        
        var distance = Phaser.Math.Distance.Between(container.x, container.y, globalPointer.x, globalPointer.y - clickOffsetY);

        if (container.body.speed > 0)
        {
            if (distance < 2)
            {
                container.body.reset(globalPointer.x, globalPointer.y - clickOffsetY);
            }
        }

        // Actions (CRRENTLY LOCAL ONLY)
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