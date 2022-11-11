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

var usernameLabelCenter = 0;
var clickOffsetY = 110;
var usernameOffsetY = 30;
var numContainerItems = 10;

var container;
var player = null;
var playerCollision;
var head, eyes, brow, lips, hairUpper, hairLower, topItem, bottomItem, outfit, shoes, board, usernameTag, usernameLabel;


var inGame = new Phaser.Scene('GameScene');


inGame.init = function()
{
    //  inject css
    var element = document.createElement('style');
    document.head.appendChild(element);

    var sheet = element.sheet;
    var styles = '@font-face { font-family: "usernameFont"; src: url("src/assets/fonts/Cedora-RegularStd.otf") format("opentype"); }\n';

    sheet.insertRule(styles, 0);
}

inGame.preload = function() {
    this.load.setBaseURL('/src/assets')

    this.load.image('roomBg', 'scene/room-downtown.png');

    // load all avatar bases
    for (let i = 0; i < 6; i++) {
        this.load.spritesheet('body-' + i.toString(), 'avatar/body-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
        this.load.spritesheet('face-' + i.toString(), 'avatar/face-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
    }
    
    // load all avatar eyes
    for (let i = 0; i < 14; i++) {
        this.load.spritesheet('eyes-' + i.toString(), 'avatar/eyes-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
    }

    // load brows and lips
    this.load.spritesheet('brow-0', 'avatar/brow-0.png', { frameWidth: 300, frameHeight: 250 });
    this.load.spritesheet('lips-0', 'avatar/lips-0.png', { frameWidth: 300, frameHeight: 250 });

    // load items
    this.load.spritesheet('f-0-0-1', 'item/f-0-0-1.png', { frameWidth: 300, frameHeight: 250 });
    this.load.spritesheet('f-0-0-2', 'item/f-0-0-2.png', { frameWidth: 300, frameHeight: 250 });

    this.load.spritesheet('f-1-0', 'item/f-1-0.png', { frameWidth: 300, frameHeight: 250 });

    this.load.spritesheet('f-4-0', 'item/f-4-0.png', { frameWidth: 300, frameHeight: 250 });



    this.load.image('username-tag', 'avatar/username-tag.png');
    this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

    // load anim data
    this.load.json('bodyAnims', 'anims/bodyAnims.json');
    this.load.json('bottomShoes', 'anims/bottomShoes.json');
    this.load.json('eyesAnims', 'anims/eyesAnims.json');
    this.load.json('hairAnims', 'anims/hairAnims.json');
}

inGame.create = function() {

    WebFont.load({
        custom: {
            families: [ 'usernameFont' ]
        },
        active: function ()
        {
            console.log('font loaded');
        }
    });
    
    var bg = this.add.image(400, 260, 'roomBg');
    var otherPlayers = this.add.group();

    let data = this.cache.json.get('bodyAnims');
    let dataFace = this.cache.json.get('bottomShoes');
    let dataEyes = this.cache.json.get('eyesAnims');
    let dataHair = this.cache.json.get('hairAnims');

    key1 = inGame.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    key2 = inGame.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    key3 = inGame.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    key4 = inGame.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);

    cursors = this.input.keyboard.createCursorKeys();
    
    function createPlayer(playerInfo) {
        player = inGame.add.sprite(0, 0, 'body-' +  playerInfo.avatar['skinTone']);
        head = inGame.add.sprite(0, 0, 'face-' +  playerInfo.avatar['skinTone']);
        eyes = inGame.add.sprite(0, 0, 'eyes-' +  playerInfo.avatar['eyeType']);
        lips = inGame.add.sprite(0, 0, 'lips-0');

        hairUpper = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-1');
        hairLower = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-2');
        
        topItem = inGame.add.sprite(0, 0, 'f-1-0');
        shoes = inGame.add.sprite(0, 0, 'f-4-0');
        // brow = inGame.add.sprite(0, 0, 'brow-0');
        usernameTag = inGame.add.sprite(0, 0, 'username-tag');

        usernameLabel = inGame.add.text(0, 100, playerInfo.username, { fontFamily: 'usernameFont', fontSize: '15px', fill: "#000000" });
        usernameLabel.originX = 0.5;
        usernameLabelCenter = usernameLabel.getCenter().x;
        usernameLabel.x = usernameLabelCenter;
        usernameLabel.setStroke('#ffffff', 2);
        
        container = inGame.add.container(playerInfo.x, playerInfo.y);
        container.setSize(300, 250);

        container.add([head, eyes, lips, hairLower, hairUpper, player, topItem, shoes, usernameTag, usernameLabel]);

        inGame.physics.add.existing(container, false);
        container.body.setCollideWorldBounds(false);

        container.setDataEnabled();
        container.setData('username', playerInfo.username);
        container.setData('skinTone', playerInfo.avatar['skinTone']);
        container.setData('eyeType', playerInfo.avatar['eyeType']);
        container.setData('gender', playerInfo.avatar['gender']);
        container.setData('equipped', playerInfo.avatar['equipped']);
    }

    function addOtherPlayers(playerInfo) {
        const otherPlayer = inGame.add.sprite(playerInfo.x, playerInfo.y, 'body-' + playerInfo.avatar['skinTone']);
        const otherHead = inGame.add.sprite(playerInfo.x, playerInfo.y, 'face-' + playerInfo.avatar['skinTone']);
        const otherEyes = inGame.add.sprite(playerInfo.x, playerInfo.y, 'eyes-' + playerInfo.avatar['eyeType']);
        const otherLips = inGame.add.sprite(playerInfo.x, playerInfo.y, 'lips-0');

        const otherHairUpper = inGame.add.sprite(playerInfo.x, playerInfo.y, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-1');
        const otherHairLower = inGame.add.sprite(playerInfo.x, playerInfo.y, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-2');
        
        const otherTopItem = inGame.add.sprite(playerInfo.x, playerInfo.y, 'f-1-0');

        const otherShoes = inGame.add.sprite(playerInfo.x, playerInfo.y, 'f-4-0');
    
        var otherUsernameTag = inGame.add.sprite(playerInfo.x, playerInfo.y, 'username-tag');
        var otherUsernameLabel = inGame.add.text(playerInfo.x, playerInfo.y + 100, playerInfo.username, { fontFamily: 'usernameFont', fontSize: '15px', fill: "#000000" });
        
        otherUsernameLabel.originX = 0.5;
        var tempCenter = otherUsernameLabel.getCenter().x;
        otherUsernameLabel.x = tempCenter;
        otherUsernameLabel.setStroke('#ffffff', 2);

        otherPlayer.flipX = playerInfo.flipX;
        otherHead.flipX = playerInfo.flipX;
        otherEyes.flipX = playerInfo.flipX;
        otherLips.flipX = playerInfo.flipX;
        otherHairUpper.flipX = playerInfo.flipX;
        otherHairLower.flipX = playerInfo.flipX;
        otherTopItem.flipX = playerInfo.flipX;
        otherShoes.flipX = playerInfo.flipX;

        otherUsernameTag.flipX = playerInfo.flipX;

        if (playerInfo.flipX) {
            otherHead.setPosition(playerInfo.x, playerInfo.y);
            otherEyes.setPosition(playerInfo.x, playerInfo.y);
        }
        const otherContainer = inGame.add.container([otherHead, otherEyes, otherLips, otherHairLower, otherHairUpper, otherPlayer, otherTopItem, otherShoes, otherUsernameTag, otherUsernameLabel]);
        
        otherContainer.flipX = playerInfo.flipX;
        otherContainer.setDataEnabled();
        otherContainer.setData('username', playerInfo.username);
        otherContainer.setData('usernameLabelCenter', tempCenter);
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
                for (let j = 0; j < numContainerItems; j++) {
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

                for (let i = 0; i < 8; i++) {
                    p.x[i].flipX = p.flipX;
                }

                p.x[0].setPosition(playerInfo.x, playerInfo.y);
                p.x[1].setPosition(playerInfo.x, playerInfo.y);
                p.x[2].setPosition(playerInfo.x, playerInfo.y);
                p.x[3].setPosition(playerInfo.x, playerInfo.y);
                p.x[4].setPosition(playerInfo.x, playerInfo.y);
                p.x[5].setPosition(playerInfo.x, playerInfo.y);
                p.x[6].setPosition(playerInfo.x, playerInfo.y);
                p.x[7].setPosition(playerInfo.x, playerInfo.y);
                p.x[8].setPosition(playerInfo.x, playerInfo.y);

                p.x[9].originX = 0.5;
                p.x[9].y = playerInfo.y + 100;
                p.x[9].x = playerInfo.x;
            }
            }.bind(this));
        }
    }.bind(this));
    

    //#region Animations
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

    dataFace.skins.forEach(skin => {
        dataFace.keys.forEach(key => {
            this.anims.create({
                key: skin + '-' + key,
                frames: this.anims.generateFrameNumbers(skin, { frames: dataFace.frames[key] }),
                frameRate: dataFace.frameRate,
                repeat: dataFace.repeat
            });
        })
    });

    dataEyes.skins.forEach(skin => {
        dataEyes.keys.forEach(key => {
            this.anims.create({
                key: skin + '-' + key,
                frames: this.anims.generateFrameNumbers(skin, { frames: dataEyes.frames[key] }),
                frameRate: dataEyes.frameRate,
                repeat: dataEyes.repeat
            });
        })
    });

    dataHair.skins.forEach(skin => {
        dataHair.keys.forEach(key => {
            this.anims.create({
                key: skin + '-' + key,
                frames: this.anims.generateFrameNumbers(skin, { frames: dataHair.frames[key] }),
                frameRate: dataHair.frameRate,
                repeat: dataHair.repeat
            });
        })
    });
    //#endregion

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
            // brow.flipX = false;
            eyes.flipX = false;
            lips.flipX = false;
            hairLower.flipX = false;
            hairUpper.flipX = false;
            topItem.flipX = false;
            shoes.flipX = false;

        } else if (cursors.right.isDown || container.body.velocity.x > 0) {
            player.flipX = true;
            head.flipX = true;
            // brow.flipX = true;
            eyes.flipX = true;
            lips.flipX = true;
            hairLower.flipX = true;
            hairUpper.flipX = true;
            topItem.flipX = true;
            shoes.flipX = true;
        }
        //#endregion


        // Click Movement
        
        var distance = Phaser.Math.Distance.Between(container.x, container.y, globalPointer.x, globalPointer.y - clickOffsetY);

        if (container.body.speed > 0)
        {
            if (distance < 4)
            {
                container.body.reset(globalPointer.x, globalPointer.y - clickOffsetY);
            }
        }

        // Actions (CRRENTLY LOCAL ONLY)
        if (key1.isDown) {
            if (!player.anims.isPlaying) {
                player.play('body-' + container.getData('skinTone') + '-wave');
                topItem.play('f-1-0-wave');
            }
        }

        if (key2.isDown) {
            if (!player.anims.isPlaying) {
                player.play('body-' + container.getData('skinTone') + '-cry');
                head.play('face-' + container.getData('skinTone') + '-cry');
                eyes.play('eyes-' + container.getData('eyeType') + '-cry');
                hairUpper.play('f-0-' + container.getData('equipped')[0] + '-1-cry');
                hairLower.play('f-0-' + container.getData('equipped')[0] + '-2-cry');
                topItem.play('f-1-' + container.getData('equipped')[1] + '-cry');
            }
        }

        if (key3.isDown) {
            if (!player.anims.isPlaying) {
                player.play('body-' + container.getData('skinTone') + '-jump');
                head.play('face-' + container.getData('skinTone') + '-jump');
                eyes.play('eyes-' + container.getData('eyeType') + '-jump');
                hairUpper.play('f-0-' + container.getData('equipped')[0] + '-1-jump');
                hairLower.play('f-0-' + container.getData('equipped')[0] + '-2-jump');
                topItem.play('f-1-' + container.getData('equipped')[1] + '-jump');
                shoes.play('f-4-' + container.getData('equipped')[4] + '-jump');
            }
        }

        if (key4.isDown) {
            if (!player.anims.isPlaying) {
                eyes.play('eyes-' + container.getData('eyeType') + '-wink');
            }
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