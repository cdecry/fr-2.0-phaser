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
                moveBelow: true,
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
var numContainerItems = 13;
var chatBubbleOffsetY = -125;

var container;
var player = null;
var playerCollision;
var head, eyes, brow, lips, hairUpper, hairLower, bottomItem, topItem, outfit, shoes, board, usernameTag, usernameLabel;

var bubbleLifeTime, messageLifeTime, chatBubble, chatMessage;

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

    this.load.plugin('rexlifetimeplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexlifetimeplugin.min.js', true);

    this.load.image('roomBg', 'scene/location/room-downtown.png');
    this.load.image('uiBar', 'scene/chat/ui-bar.png');
    this.load.html('uiBottomBar', 'html/uibar.html');
    this.load.html('chatBar', 'html/chatbar.html');
    this.load.html('messageWidth', 'html/messagewidth.html');
    this.load.html('chatMessageHTML', 'html/chatmessage.html');
    this.load.html('instantMessengerHTML', 'html/instantmessenger.html');

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

    // load hairs
    for (let i = 0; i < 10; i++) {
        this.load.spritesheet('f-0-' + i.toString() + '-1', 'item/f-0-' + i.toString() + '-1.png', { frameWidth: 300, frameHeight: 250 });
        this.load.spritesheet('f-0-' + i.toString() + '-2', 'item/f-0-' + i.toString() + '-2.png', { frameWidth: 300, frameHeight: 250 });
    }

    this.load.spritesheet('f-0-0-1', 'item/f-0-0-1.png', { frameWidth: 300, frameHeight: 250 });
    this.load.spritesheet('f-0-0-2', 'item/f-0-0-2.png', { frameWidth: 300, frameHeight: 250 });

    // load bottoms
    for (let i = 0; i < 16; i++) {
        this.load.spritesheet('f-2-' + i.toString(), 'item/f-2-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
    }

    // load tops
    for (let i = 0; i < 16; i++) {
        this.load.spritesheet('f-1-' + i.toString(), 'item/f-1-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
    }

    // load shoes
    for (let i = 0; i < 5; i++) {
        this.load.spritesheet('f-4-' + i.toString(), 'item/f-4-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
    }

    // load boards
    for (let i = 0; i < 1; i++) {
        this.load.spritesheet('n-5-' + i.toString(), 'item/n-5-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
    }

    this.load.image('username-tag', 'avatar/username-tag.png');
    this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

    // load chat message containers
    // load all avatar eyes
    for (let i = 1; i < 11; i++) {
        this.load.image('message-' + i.toString(), 'scene/chat/message-' + i.toString() + '.png');
    }


    // load anim data
    this.load.json('bodyAnims', 'anims/bodyAnims.json');
    this.load.json('bottomShoes', 'anims/bottomShoes.json');
    this.load.json('eyesAnims', 'anims/eyesAnims.json');
    this.load.json('hairAnims', 'anims/hairAnims.json');
    this.load.json('lipsAnims', 'anims/lipsAnims.json');
}

inGame.create = function() {

    var isTyping = false;

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
    bg.setDepth(-500);

    var uiBar = this.add.image(400, 490, 'uiBar');

    // const uiBottomBar = this.add.dom(7, 464).createFromCache('uiBottomBar');
    const chatBar = this.add.dom(185, 470).createFromCache('chatBar');
    // const instantMessenger = this.add.dom(0, 0).createFromCache('instantMessengerHTML');

        // make window draggable
        // dragElement(instantMessenger.getChildByID("im-window"));
        
        // function dragElement(elmnt) {
        //     var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        //     instantMessenger.getChildByID('im-header').onmousedown = dragMouseDown;
        
        //     function dragMouseDown(e) {
        //     e = e || window.event;
        //     e.preventDefault();

        //     pos3 = e.clientX;
        //     pos4 = e.clientY;
        //     instantMessenger.onmouseup = closeDragElement;

        //     instantMessenger.onmousemove = elementDrag;
        //     }
        
        //     function elementDrag(e) {
        //     e = e || window.event;
        //     e.preventDefault();

        //     pos1 = pos3 - e.clientX;
        //     pos2 = pos4 - e.clientY;
        //     pos3 = e.clientX;
        //     pos4 = e.clientY;

        //     elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        //     elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        //     }
        
        //     function closeDragElement() {

        //         instantMessenger.onmouseup = null;
        //         instantMessenger.onmousemove = null;
        //     }
        // }
        
        // function clickChatTab(elmnt) {
        //     const tabs = instantMessenger.querySelectorAll('.chat-tab');
        //     tabs.forEach(tab => {
        //         tab.style.background = 'white';
        //     });
        //     elmnt.style.background = 'linear-gradient(to bottom, #3fccf0 2px, #20a0f0 13px, #20a0f0)';
        // }

    var inputChat = chatBar.getChildByName('chatInput');
    var defaultChatBarMessage = "Click Here Or Press ENTER To Chat";

    setTimeout(() => {
        inputChat.value = defaultChatBarMessage;
    }, 1000);

    uiBar.setDepth(1000);

    inGame.input.keyboard.on('keydown-ENTER', function (event) {

        if (isTyping === false) {
            inputChat.value = '';
            inputChat.focus();
            isTyping = true;
        }
        else if (inputChat.value !== ''){

            if (bubbleLifeTime != undefined && bubbleLifeTime.isAlive) {
                bubbleLifeTime.stop();
                messageLifeTime.stop();
                chatBubble.destroy()
                chatMessage.destroy();
            }
            createSpeechBubble(400, 200, inputChat.value);
            socket.emit('chatMessage', inputChat.value);
            
            inputChat.value = '';
        }
    });

    inputChat.addEventListener('focus', (event) => {
        inputChat.value = '';
        isTyping = true;
      });

    chatBar.addListener('click');
    chatBar.on('click', function (event) {
        if (event.target.name === 'sendChatButton')
        {   
            if (inputChat.value !== '')
            {
                if (bubbleLifeTime != undefined && bubbleLifeTime.isAlive) {
                    bubbleLifeTime.stop();
                    messageLifeTime.stop();
                    chatBubble.destroy()
                    chatMessage.destroy();
                }
                createSpeechBubble(400, 200, inputChat.value);

                socket.emit('chatMessage', inputChat.value);
                inputChat.value = '';
            }
        }
    });

    var otherPlayers = this.add.group();

    let data = this.cache.json.get('bodyAnims');
    let dataFace = this.cache.json.get('bottomShoes');
    let dataEyes = this.cache.json.get('eyesAnims');
    let dataHair = this.cache.json.get('hairAnims');
    let dataLips = this.cache.json.get('lipsAnims');

    key1 = inGame.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE, false);
    key2 = inGame.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO, false);
    key3 = inGame.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE, false);
    key4 = inGame.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR, false);

    keyLeft = inGame.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    keyRight = inGame.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    keyUp = inGame.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    keyDown = inGame.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);

    keyEnter = inGame.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    
    function createPlayer(playerInfo) {
        player = inGame.add.sprite(0, 0, 'body-' +  playerInfo.avatar['skinTone']);
        head = inGame.add.sprite(0, 0, 'face-' +  playerInfo.avatar['skinTone']);
        eyes = inGame.add.sprite(0, 0, 'eyes-' +  playerInfo.avatar['eyeType']);
        lips = inGame.add.sprite(0, 0, 'lips-0');

        board = inGame.add.sprite(0, 0, 'n-5-' + playerInfo.avatar['equipped'][5]);

        hairUpper = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-1');
        hairLower = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-2');
        
        bottomItem = inGame.add.sprite(0, 0, 'f-2-' + playerInfo.avatar['equipped'][2]);
        topItem = inGame.add.sprite(0, 0, 'f-1-' + playerInfo.avatar['equipped'][1]);
        
        shoes = inGame.add.sprite(0, 0, 'f-4-' + playerInfo.avatar['equipped'][4]);
        brow = inGame.add.sprite(0, 0, 'brow-0');
        usernameTag = inGame.add.sprite(0, 0, 'username-tag');

        usernameLabel = inGame.add.text(0, 100, playerInfo.username, { fontFamily: 'usernameFont', fontSize: '15px', fill: "#000000" });
        usernameLabel.originX = 0.5;
        usernameLabelCenter = usernameLabel.getCenter().x;
        usernameLabel.x = usernameLabelCenter;
        usernameLabel.setStroke('#ffffff', 2);
        
        container = inGame.add.container(playerInfo.x, playerInfo.y);
        container.setSize(300, 250);

        container.add([head, eyes, lips, board, hairLower, hairUpper, brow, player, bottomItem, topItem, shoes, usernameTag, usernameLabel]);

        inGame.physics.add.existing(container, false);

        container.setDepth(container.y);
        container.body.setCollideWorldBounds(false);

        container.setDataEnabled();
        container.setData('username', playerInfo.username);
        container.setData('skinTone', playerInfo.avatar['skinTone']);
        container.setData('eyeType', playerInfo.avatar['eyeType']);
        container.setData('gender', playerInfo.avatar['gender']);
        container.setData('equipped', playerInfo.avatar['equipped']);
    }

    function addOtherPlayers(playerInfo) {
        const otherHead = inGame.add.sprite(playerInfo.x, playerInfo.y, 'face-' + playerInfo.avatar['skinTone']);
        const otherEyes = inGame.add.sprite(playerInfo.x, playerInfo.y, 'eyes-' + playerInfo.avatar['eyeType']);
        const otherLips = inGame.add.sprite(playerInfo.x, playerInfo.y, 'lips-0');

        const otherBoard = inGame.add.sprite(playerInfo.x, playerInfo.y, 'n-5-' + playerInfo.avatar['equipped'][5]);

        const otherHairLower = inGame.add.sprite(playerInfo.x, playerInfo.y, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-2');
        const otherHairUpper = inGame.add.sprite(playerInfo.x, playerInfo.y, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-1');
        const otherBrow = inGame.add.sprite(0, 0, 'brow-0');

        const otherPlayer = inGame.add.sprite(playerInfo.x, playerInfo.y, 'body-' + playerInfo.avatar['skinTone']);
        const otherBottomItem = inGame.add.sprite(playerInfo.x, playerInfo.y, 'f-2-' + playerInfo.avatar['equipped'][2]);
        const otherTopItem = inGame.add.sprite(playerInfo.x, playerInfo.y, 'f-1-' + playerInfo.avatar['equipped'][1]);
        const otherShoes = inGame.add.sprite(playerInfo.x, playerInfo.y, 'f-4-' + playerInfo.avatar['equipped'][4]);
    
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

        otherBoard.flipX = playerInfo.flipX;

        otherHairUpper.flipX = playerInfo.flipX;
        otherHairLower.flipX = playerInfo.flipX;
        otherBottomItem.flipX = playerInfo.flipX;
        otherTopItem.flipX = playerInfo.flipX;
        otherShoes.flipX = playerInfo.flipX;

        otherUsernameTag.flipX = playerInfo.flipX;

        if (playerInfo.flipX) {
            otherHead.setPosition(playerInfo.x, playerInfo.y);
            otherEyes.setPosition(playerInfo.x, playerInfo.y);
        }

        const otherContainer = inGame.add.container([otherHead, otherEyes, otherLips, otherBoard, otherHairLower, otherHairUpper, otherBrow, otherPlayer, otherBottomItem, otherTopItem, otherShoes, otherUsernameTag, otherUsernameLabel]);
        
        otherHead.setDepth(playerInfo.y);
        otherEyes.setDepth(playerInfo.y);
        otherLips.setDepth(playerInfo.y);
        otherBoard.setDepth(playerInfo.y);
        otherHairLower.setDepth(playerInfo.y);
        otherHairUpper.setDepth(playerInfo.y);
        otherBrow.setDepth(playerInfo.y);
        otherPlayer.setDepth(playerInfo.y);
        otherBottomItem.setDepth(playerInfo.y);
        otherTopItem.setDepth(playerInfo.y);
        otherShoes.setDepth(playerInfo.y);
        otherUsernameTag.setDepth(playerInfo.y);
        otherUsernameLabel.setDepth(playerInfo.y);
        
        otherContainer.flipX = playerInfo.flipX;
        otherContainer.setDataEnabled();
        otherContainer.setData('username', playerInfo.username);
        otherContainer.setData('skinTone', playerInfo.avatar['skinTone']);
        otherContainer.setData('eyeType', playerInfo.avatar['eyeType']);
        otherContainer.setData('gender', playerInfo.avatar['gender']);
        otherContainer.setData('equipped', playerInfo.avatar['equipped']);
        otherContainer.setData('messageData', { hasMessage: false, otherChatBubble: null, otherChatMessage: null, otherBubbleLifeTime: null, otherMessageLifeTime: null });

        otherContainer.id = playerInfo.id;

        otherPlayers.add(otherContainer);
      }


    function createSpeechBubble (x, y, quote)
    {
        
        chatMessage = inGame.add.dom(0, 0).createFromCache('chatMessageHTML');
        chatMessage.setInteractive;
        var chatMessageContent = chatMessage.getChildByID('message');
        chatMessageContent.innerHTML = quote;

        var divHeight = chatMessageContent.clientHeight;
        var lines = divHeight / 15;

        chatBubble = inGame.add.image(0, chatBubbleOffsetY, 'message-' + lines.toString());

        chatBubble.setDepth(900);
        chatMessage.setDepth(900);

        bubbleLifeTime = inGame.plugins.get('rexlifetimeplugin').add(chatBubble, {
            lifeTime: 5000,
            destroy: true,
            start: true
        });

        messageLifeTime = inGame.plugins.get('rexlifetimeplugin').add(chatMessage, {
            lifeTime: 5000,
            destroy: true,
            start: true
        });

        container.add([chatBubble, chatMessage]);
    }
    
    function createOtherSpeechBubble (otherPlayer, x, y, quote)
    {
        var otherChatMessage = inGame.add.dom(x, y).createFromCache('chatMessageHTML');
        var otherChatMessageContent = otherChatMessage.getChildByID('message');
        otherChatMessageContent.innerHTML = quote;

        var divHeight = otherChatMessageContent.clientHeight;
        var lines = divHeight / 15;

        var otherChatBubble = inGame.add.image(x, y + chatBubbleOffsetY, 'message-' + lines.toString());

        otherChatBubble.setDepth(900);
        otherChatMessage.setDepth(900);
        
        var otherBubbleLifeTime = inGame.plugins.get('rexlifetimeplugin').add(otherChatBubble, {
            lifeTime: 5000,
            destroy: true,
            start: true
        }).on('complete', function () {
            otherPlayer.setData('messageData', {    'hasMessage': false,
                                                'otherChatBubble': null,
                                                'otherChatMessage': null,
                                                'otherBubbleLifeTime': null,
                                                'otherMessageLifeTime': null });
        });

        var otherMessageLifeTime = inGame.plugins.get('rexlifetimeplugin').add(otherChatMessage, {
            lifeTime: 5000,
            destroy: true,
            start: true
        });

        otherPlayer.setData('messageData', {    'hasMessage': true,
                                                'otherChatBubble': otherChatBubble,
                                                'otherChatMessage': otherChatMessage,
                                                'otherBubbleLifeTime': otherBubbleLifeTime,
                                                'otherMessageLifeTime': otherMessageLifeTime });
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

                var msgData = p.getData('messageData');
                if (msgData['hasMessage']) {
                    msgData['otherChatBubble'].setPosition(playerInfo.x, playerInfo.y + chatBubbleOffsetY);
                    msgData['otherChatMessage'].setPosition(playerInfo.x, playerInfo.y);
                }

                p.flipX = playerInfo.flipX;

                for (let i = 0; i < 11; i++) {
                    p.x[i].flipX = p.flipX;
                    p.x[i].setPosition(playerInfo.x, playerInfo.y);
                    p.x[i].setDepth(playerInfo.y);
                }

                p.x[11].setPosition(playerInfo.x, playerInfo.y);
                p.x[11].setDepth(playerInfo.y);

                p.x[12].originX = 0.5;
                p.x[12].y = playerInfo.y + 100;
                p.x[12].x = playerInfo.x;
                p.x[12].setDepth(playerInfo.y);
            }
            }.bind(this));
        }
    }.bind(this));

    globalThis.socket.on('playerWaveResponse', function (playerInfo) {
        otherPlayers.getChildren().forEach(function (p) {
            if (playerInfo.id === p.id) { // && !p.x[7].anims.isPlaying && !p.x[1].anims.isPlaying
                p.x[7].play(JSON.parse(JSON.stringify(p.x[7])).textureKey + '-wave');
                p.x[2].play(JSON.parse(JSON.stringify(p.x[2])).textureKey + '-wave');
                p.x[9].play(JSON.parse(JSON.stringify(p.x[9])).textureKey + '-wave');
                }
            }.bind(this));
    }.bind(this));

    globalThis.socket.on('playerCryResponse', function (playerInfo) {
        otherPlayers.getChildren().forEach(function (p) {
            if (playerInfo.id === p.id) {
                    for (let i = 0; i < 8; i++) {
                        p.x[i].play(JSON.parse(JSON.stringify(p.x[i])).textureKey + '-cry');
                    }
                    p.x[9].play(JSON.parse(JSON.stringify(p.x[9])).textureKey + '-cry');
                }
            }.bind(this));
    }.bind(this));

    globalThis.socket.on('playerJumpResponse', function (playerInfo) {
        otherPlayers.getChildren().forEach(function (p) {
            if (playerInfo.id === p.id) {
                    for (let i = 0; i < 3; i++) {
                        p.x[i].play(JSON.parse(JSON.stringify(p.x[i])).textureKey + '-jump');
                    }
                    for (let i = 4; i < 11; i++) {
                        p.x[i].play(JSON.parse(JSON.stringify(p.x[i])).textureKey + '-jump');
                    }
                //     player.play('body-' + container.getData('skinTone') + '-jump');
                // head.play('face-' + container.getData('skinTone') + '-jump');
                // eyes.play('eyes-' + container.getData('eyeType') + '-jump');
                // lips.play('lips-0-jump');
                // hairUpper.play('f-0-' + container.getData('equipped')[0] + '-1-jump');
                // hairLower.play('f-0-' + container.getData('equipped')[0] + '-2-jump');
                // brow.play('brow-0-jump');
                // topItem.play('f-1-' + container.getData('equipped')[1] + '-jump');
                // bottomItem.play('f-2-' + container.getData('equipped')[2] + '-jump');
                // shoes.play('f-4-' + container.getData('equipped')[4] + '-jump');
                }
            }.bind(this));
    }.bind(this));

    globalThis.socket.on('playerWinkResponse', function (playerInfo) {
        otherPlayers.getChildren().forEach(function (p) {
            if (playerInfo.id === p.id && !p.x[7].anims.isPlaying && !p.x[1].anims.isPlaying) {
                p.x[1].play(JSON.parse(JSON.stringify(p.x[1])).textureKey + '-wink');
            }
            }.bind(this));
    }.bind(this));

    globalThis.socket.on('chatMessageResponse', function (playerInfo, msg) {
        otherPlayers.getChildren().forEach(function (p) {
            if (playerInfo.id === p.id && !p.x[7].anims.isPlaying && !p.x[1].anims.isPlaying) {

                var msgData = p.getData('messageData');
                if (msgData['hasMessage']) {
                    msgData['otherBubbleLifeTime'].stop();
                    msgData['otherMessageLifeTime'].stop();
                    msgData['otherChatBubble'].destroy();
                    msgData['otherChatMessage'].destroy();
                }
                createOtherSpeechBubble(p, playerInfo.x, playerInfo.y, msg);
            }
            }.bind(this));

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

    dataLips.skins.forEach(skin => {
        dataLips.keys.forEach(key => {
            this.anims.create({
                key: skin + '-' + key,
                frames: this.anims.generateFrameNumbers(skin, { frames: dataLips.frames[key] }),
                frameRate: dataLips.frameRate,
                repeat: dataLips.repeat
            });
        })
    });
    //#endregion
    
    this.input.on('pointerdown', function (pointer) {
        isTyping = false;
        inputChat.value = defaultChatBarMessage;
        inputChat.blur();
        
        globalPointer.x = pointer.x;
        globalPointer.y = pointer.y;
        inGame.physics.moveTo(container, pointer.x, pointer.y - clickOffsetY, 150);
        // moveXY(pointer.x, pointer.y - clickOffsetY);
    });
    // EXAMPLE
    // var tempNamespace = {};
    // var myString = "crystal";

    // tempNamespace[myString] = this.add.sprite(400, 260, 'body-0');;

    // tempNamespace[myString].play('body-0-jump');
}

var tween;
var movedRight = false;

function moveX(currentPosX, currentPosY, direction) {
	tween = inGame.tweens.add({
        targets: container,
        x: currentPosX + direction*70,
        y: currentPosY,
        ease: 'Linear',
        duration: 600,
    });
}

function moveY(currentPosX, currentPosY, direction) {
	tween = inGame.tweens.add({
        targets: container,
        x: currentPosX,
        y: currentPosY + direction*70,
        ease: 'Linear',
        duration: 600,
    });
}

function moveXY(newPosX, newPosY) {

    if (tween != undefined && tween != null)
        tween.stop();

    if (newPosX - container.x > 0)
        movedRight = true;
    else if (newPosX - container.x < 0)
        movedRight = false;

    var distanceX = Math.abs(newPosX - container.x);
    var distanceY = Math.abs(newPosY - container.y);
    var distanceXY = Math.sqrt(distanceX ** 2 + distanceY ** 2);

    var time = distanceXY / 150 * 1000;

	tween = inGame.tweens.add({
        targets: container,
        x: newPosX,
        y: newPosY,
        ease: 'Linear',
        duration: time,
    });
}

inGame.update = function() {
    if (container) {
        container.setDepth(container.y);
        //#region Arrow Key Movement
        // Horizontal movement
        if (keyLeft.isDown) {
            container.body.setVelocity(0);
            moveX(container.x, container.y, -1);

        } else if (keyRight.isDown) {
            container.body.setVelocity(0);
            moveX(container.x, container.y, 1);
        }

        // Vertical movement
        if (keyUp.isDown) {
            container.body.setVelocity(0);
            moveY(container.x, container.y, -1);

        } else if (keyDown.isDown) {
            container.body.setVelocity(0);
            moveY(container.x, container.y, 1);
        }

        // Flip
        if (keyLeft.isDown || container.body.velocity.x < 0) {

            player.flipX = false;
            head.flipX = false;
            brow.flipX = false;
            eyes.flipX = false;
            lips.flipX = false;
            board.flipX = false;
            hairLower.flipX = false;
            hairUpper.flipX = false;
            topItem.flipX = false;
            bottomItem.flipX = false;
            shoes.flipX = false;

        } else if (keyRight.isDown || container.body.velocity.x > 0) {
            player.flipX = true;
            head.flipX = true;
            brow.flipX = true;
            eyes.flipX = true;
            lips.flipX = true;
            board.flipX = true;
            hairLower.flipX = true;
            hairUpper.flipX = true;
            topItem.flipX = true;
            bottomItem.flipX = true;
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

        // Actions
        if (key1.isDown) {
            if (!player.anims.isPlaying && !eyes.anims.isPlaying) {
                globalThis.socket.emit('playerWave');
                player.play('body-' + container.getData('skinTone') + '-wave');
                topItem.play('f-1-' + container.getData('equipped')[1] + '-wave');
                lips.play('lips-0-wave');
            }
        }

        if (key2.isDown) {
            if (!player.anims.isPlaying && !eyes.anims.isPlaying) {
                globalThis.socket.emit('playerCry');
                player.play('body-' + container.getData('skinTone') + '-cry');
                head.play('face-' + container.getData('skinTone') + '-cry');
                eyes.play('eyes-' + container.getData('eyeType') + '-cry');
                hairUpper.play('f-0-' + container.getData('equipped')[0] + '-1-cry');
                hairLower.play('f-0-' + container.getData('equipped')[0] + '-2-cry');
                brow.play('brow-0-cry');
                topItem.play('f-1-' + container.getData('equipped')[1] + '-cry');
            }
        }

        if (key3.isDown) {
            if (!player.anims.isPlaying && !eyes.anims.isPlaying) {
                globalThis.socket.emit('playerJump');
                player.play('body-' + container.getData('skinTone') + '-jump');
                head.play('face-' + container.getData('skinTone') + '-jump');
                eyes.play('eyes-' + container.getData('eyeType') + '-jump');
                lips.play('lips-0-jump');
                hairUpper.play('f-0-' + container.getData('equipped')[0] + '-1-jump');
                hairLower.play('f-0-' + container.getData('equipped')[0] + '-2-jump');
                brow.play('brow-0-jump');
                topItem.play('f-1-' + container.getData('equipped')[1] + '-jump');
                bottomItem.play('f-2-' + container.getData('equipped')[2] + '-jump');
                shoes.play('f-4-' + container.getData('equipped')[4] + '-jump');
            }
        }

        if (key4.isDown) {
            if (!player.anims.isPlaying && !eyes.anims.isPlaying) {
                globalThis.socket.emit('playerWink');
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
            debug: false
        }
    },
    dom: {
        createContainer: true
        },
    pixelArt: true,
    scene: [login, loading, inGame]
    // plugins: {
    //     global: [{
    //         key: 'rexLifeTimePlugin',
    //         plugin: LifeTimePlugin,
    //         start: true
    //     },
    //     // ...
    //     ]
    // }
};

var game = new Phaser.Game(config);