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

    globalThis.socket.on('login success', (inventory) => {
        myInventory = inventory;
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
// var clickOffsetX = 0;
// var clickOffsetY = 110;
var usernameOffsetY = 30;
var numContainerItems = 13;
var chatBubbleOffsetY = -125;
var globalInputChat;

var disableInput = false;
var stopMoving = false;
var container;
var player = null;
var playerCollision, rightBound;
var locationBounds; // list of object of bounds (cannot go to ex: [{ startX: 5, startY: 5, endX: 205, endY: 105 } ]
var head, eyes, brow, lips, hairUpper, hairLower, bottomItem, topItem, shoes, board, usernameTag, usernameLabel;
var isTyping = false;
var bubbleLifeTime, messageLifeTime, chatBubble, chatMessage;
var myPlayerInfo;
var avatarPreview = null;

// Inventory Load:
var myInventory;
var iHair = [];
var iTops = [];
var iBottoms = [];
var iOutfits = [];
var iShoes = [];
var iBoards = [];
var iFaceAcc = [];
var iHeadAcc = [];
var iBodyAcc = [];

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

var uiScene = new Phaser.Scene('UIScene');

uiScene.preload = function() {
    this.load.setBaseURL('/src/assets');
    this.load.image('uiBar', 'scene/chat/ui-bar.png');
    this.load.image('inventoryWindow', 'scene/ui/inventory.png');
    this.load.image('inventoryArrowUp', 'scene/ui/inventoryArrowUp.png');
    this.load.image('inventoryArrowDown', 'scene/ui/inventoryArrowDown.png');
    this.load.html('inventoryButton', 'html/inventoryButton.html');
    this.load.html('inventoryUI', 'html/inventoryUI.html');
    this.load.html('chatBar', 'html/chatbar.html');
    this.load.html('messageWidth', 'html/messagewidth.html');
    this.load.html('chatMessageHTML', 'html/chatmessage.html');
    this.load.html('instantMessengerHTML', 'html/instantmessenger.html');
    this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
    this.load.image('bound', 'item/null.png');
}

uiScene.create = function() {

    function createAvatarPreview(playerInfo) {

        bodyPreview = uiScene.add.sprite(0, 0, 'body-' +  playerInfo.avatar['skinTone']);
        headPreview = uiScene.add.sprite(0, 0, 'face-' +  playerInfo.avatar['skinTone']);
        eyesPreview = uiScene.add.sprite(0, 0, 'eyes-' +  playerInfo.avatar['eyeType']);
        lipsPreview = uiScene.add.sprite(0, 0, 'lips-0');
        boardPreview = uiScene.add.sprite(0, 0, 'n-5-' + playerInfo.avatar['equipped'][5]);
        hairUpperPreview = uiScene.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-1');
        hairLowerPreview = uiScene.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-2');
        
        if (playerInfo.avatar['equipped'][3] === -1) {
            bottomItemPreview = uiScene.add.sprite(0, 0, 'f-2-' + playerInfo.avatar['equipped'][2]);
            topItemPreview = uiScene.add.sprite(0, 0, 'f-1-' + playerInfo.avatar['equipped'][1]);
        }
        else {
            bottomItemPreview = uiScene.add.sprite(0, 0, 'null');
            topItemPreview = uiScene.add.sprite(0, 0, 'f-3-' + playerInfo.avatar['equipped'][3]);
        }

        shoesPreview = uiScene.add.sprite(0, 0, 'f-4-' + playerInfo.avatar['equipped'][4]);
        browPreview = uiScene.add.sprite(0, 0, 'brow-0');
        usernameTagPreview = uiScene.add.sprite(0, 0, 'username-tag');
        usernameLabelPreview = uiScene.add.text(0, 100, playerInfo.username, { fontFamily: 'usernameFont', fontSize: '15px', fill: "#000000" });
        usernameLabelPreview.originX = 0.5;
        usernameLabelCenter = usernameLabel.getCenter().x;
        usernameLabelPreview.x = usernameLabelCenter;
        usernameLabelPreview.setStroke('#ffffff', 2);
        
        var children  = [headPreview, eyesPreview, lipsPreview, boardPreview, hairLowerPreview, hairUpperPreview, browPreview, bodyPreview, bottomItemPreview, topItemPreview, shoesPreview, usernameTagPreview, usernameLabelPreview];
            avatarPreview = uiScene.add.container(0, 0);
            avatarPreview.add(children);
            avatarPreview.setDepth(1001);
    }

    WebFont.load({
        custom: {
            families: [ 'usernameFont' ]
        },
        active: function ()
        {
            console.log('font loaded');
        }
    });

    var uiBar = this.add.image(400, 490, 'uiBar');
    var inventory = this.add.image(400, 260, 'inventoryWindow');
    var inventoryUI = this.add.dom(763,20).createFromCache('inventoryUI');
    var inventoryButton = this.add.dom(152, 490).createFromCache('inventoryButton');
    
    inventory.setDepth(1000);
    inventory.setVisible(false);
    inventoryUI.setVisible(false);

    var chatBar = this.add.dom(185, 470).createFromCache('chatBar');
    var inputChat = chatBar.getChildByName('chatInput');
    globalInputChat = inputChat;
    var defaultChatBarMessage = "Click Here Or Press ENTER To Chat";

    setTimeout(() => {
        inputChat.value = defaultChatBarMessage;
    }, 1000);

    uiBar.setDepth(1000);

    inGame.input.keyboard.on('keydown-ENTER', function (event) {
        if (disableInput) return;
        if (isTyping === false) {
            globalInputChat.value = '';
            globalInputChat.focus();
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
        globalInputChat.value = '';
        isTyping = true;
      });

    chatBar.addListener('click');
    chatBar.on('click', function (event) {
        if (event.target.name === 'sendChatButton')
        {   
            if (globalInputChat.value !== '')
            {
                if (bubbleLifeTime != undefined && bubbleLifeTime.isAlive) {
                    bubbleLifeTime.stop();
                    messageLifeTime.stop();
                    chatBubble.destroy()
                    chatMessage.destroy();
                }
                createSpeechBubble(400, 200, inputChat.value);

                socket.emit('chatMessage', inputChat.value);
                globalInputChat.value = '';
            }
        }
    });

    inventoryButton.addListener('click');
    inventoryButton.on('click', function (event) {
        disableInput = true;
        inventory.setVisible(true);
        inventoryUI.setVisible(true);
        uiBar.setVisible(false);
        inventoryButton.setVisible(false);
        chatBar.setVisible(false);

        loadInventory();

        inventoryUI.addListener('click');
        inventoryUI.on('click', function (event) {
            if (event.target.id === 'closeInventoryButton') {
                disableInput = false;

                inventoryButton.setVisible(true);
                chatBar.setVisible(true);
                uiBar.setVisible(true);

                inventory.setVisible(false);
                inventoryUI.setVisible(false);

                // hide loaded clothes, avatar preview
                inventoryItems.forEach(item => item.destroy());
                if (prevButton != null)
                    prevButton.destroy();
                if (nextButton != null)
                    nextButton.destroy();
                avatarPreview.visible = false;
            }
        });
    });

    // Define variables for the grid layout
    let inventoryItems = []
    var gridWidth = 8;
    var gridHeight = 3;
    var cellWidth = 62;
    var cellHeight = 110;
    var gridX = 70;
    var gridY = 220;

    // Define variables for the inventory items and navigation buttons
    let prevButton = null;
    let nextButton = null;

    // Define a variable for the current page index
    let currentPage = 0;

    // Create the inventory items for the current page
    function createInventoryItems(typeId) {
        // Clear any existing inventory items, reset current page
        inventoryItems.forEach(item => item.destroy());
        inventoryItems = [];

        // Get the items for the current page
        const startIndex = currentPage * gridWidth * gridHeight;
        const endIndex = Math.min(startIndex + gridWidth * gridHeight, myInventory[typeId].length);

        // Create the items for the current page
        for (let i = startIndex; i < endIndex; i++) {
            
            const item = uiScene.add.sprite(0, 0, 'f-'+ typeId.toString()+ '-' + myInventory[typeId][i].id.toString());
            item.setDepth(1001);
            inventoryItems.push(item);
        }

        // Align the items in a grid layout
        Phaser.Actions.GridAlign(inventoryItems, {
            width: gridWidth,
            height: gridHeight,
            cellWidth: cellWidth,
            cellHeight: cellHeight,
            x: gridX,
            y: gridY
        });

        // // Update the visibility of the navigation buttons
        prevButton.visible = currentPage > 0;
        nextButton.visible = endIndex < myInventory[typeId].length;
        console.log(startIndex, endIndex);
    }

    // Create the navigation buttons
    function createNavigationButtons(typeId) {
        // Create the "previous page" button
        prevButton = uiScene.add.sprite(550, 160, 'inventoryArrowUp');
        prevButton.setDepth(1001);
        prevButton.setInteractive();
        prevButton.on('pointerdown', () => {
            currentPage--;
            createInventoryItems(typeId);
        });

        // Create the "next page" button
        nextButton = uiScene.add.sprite(550, 460, 'inventoryArrowDown');
        nextButton.setDepth(1001);
        nextButton.setInteractive();
        nextButton.on('pointerdown', () => {
            currentPage++;
            createInventoryItems(typeId);
        });
    }

    function loadInventory() {
        // Default tab is Hair

        // iHair = [];
        // var item;
        // for (var i = 0; i < myInventory[0].length; i++) {
        //     item = inGame.add.sprite(0, 0, 'f-0-' + myInventory[0][i].id.toString() + '-1', 4);
        //     item.setDepth(1001);
        //     iHair.push(item);
        // }

        // Phaser.Actions.GridAlign(iHair, {
        //     width: 8,
        //     height: 4,
        //     cellWidth: 80,
        //     cellHeight: 80,
        //     x: -30,
        //     y: 100
        // });

        // Call the functions to create the initial inventory items and navigation buttons
        createNavigationButtons(0);
        createInventoryItems(0);
    
        
        // //  Tops
        // iTops = [];
        // for (var i = 0; i < myInventory[1].length; i++) {
        //     item = inGame.add.sprite(0, 0, 'f-0-' + myInventory[1][i].id.toString());
        //     item.setDepth(1001);
        //     iTops.push(item);
        // }

        // Phaser.Actions.GridAlign(iTops, {
        //     width: 8,
        //     height:2,
        //     cellWidth: 60,
        //     cellHeight: 60,
        //     x: -50,
        //     y: 30
        // });

        if (avatarPreview == null)
            createAvatarPreview(myPlayerInfo);
        else
            avatarPreview.visible = true;

        avatarPreview.setPosition(675, 250);
    }
}



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
    this.load.image('downtownBg', 'scene/location/downtown.png');
    this.load.image('beachBg', 'scene/location/beach.png');


    this.load.image('avatarCollider', 'avatar/avatarCollider.png');

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

    // load hairs & mannequins
    for (let i = 0; i < 10; i++) {
        this.load.spritesheet('f-0-' + i.toString() + '-1', 'item/f-0-' + i.toString() + '-1.png', { frameWidth: 300, frameHeight: 250 });
        this.load.spritesheet('f-0-' + i.toString() + '-2', 'item/f-0-' + i.toString() + '-2.png', { frameWidth: 300, frameHeight: 250 });
        this.load.image('f-0-' + i.toString(), 'item/f-0-' + i.toString() + '.png');
    }

    // load bottoms
    for (let i = 0; i < 16; i++) {
        this.load.spritesheet('f-2-' + i.toString(), 'item/f-2-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
    }

    // load tops
    for (let i = 0; i < 16; i++) {
        this.load.spritesheet('f-1-' + i.toString(), 'item/f-1-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
    }

    // load outfits
    for (let i = 0; i < 13; i++) {
        this.load.spritesheet('f-3-' + i.toString(), 'item/f-3-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
    }

    // load shoes
    for (let i = 0; i < 5; i++) {
        this.load.spritesheet('f-4-' + i.toString(), 'item/f-4-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
    }

    // load boards
    for (let i = 0; i < 1; i++) {
        this.load.spritesheet('n-5-' + i.toString(), 'item/n-5-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
    }

    // load placeholder
    this.load.spritesheet('null', 'item/null.png', { frameWidth: 300, frameHeight: 250 });

    this.load.image('username-tag', 'avatar/username-tag.png');
    this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

    // load chat message containers
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

var camPosX = 0;
var camPosY = 0;
var isPanning = false;
var bg;
// init left and right bound, increase/decrease by x everytime camera moves
var leftBound = 150;
var rightBound = 650;
var clickOffsetX = 0;
var clickOffsetY = 110;
var currentLocation = "downtown";
var boundOffset = 150;

var locationConfig = {
    downtown: {
        width: 2388,
        backgroundX: 0,
        initialScroll: -200,
        playerSpawnX: 300,
        playerSpawnY: 300,
        boundsPolygon: 0    // load json polygon for space player can move around in
    }
}

inGame.create = function() {
    // Init Camera
    setCameraPosition(currentLocation);

    this.scene.launch(uiScene);
    
    // Load background
    bg = this.add.image(400, 260, 'downtownBg');
    bg.setDepth(-500);

    var defaultChatBarMessage = "Click Here Or Press ENTER To Chat";
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

    // keySpace = inGame.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    keyEnter = inGame.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // set camera position based on location
    function setCameraPosition(location) {
        let lc = locationConfig[location];
        
        inGame.cameras.main.setBounds(-lc.width/2 + 430, 0, lc.width - 60, 0);
        inGame.cameras.main.setScroll(lc.initialScroll, 0);
        clickOffsetX += lc.initialScroll;
        
        // init left/right bounds
        leftBound = lc.initialScroll + boundOffset;
        rightBound = lc.initialScroll + 800 - boundOffset;
        camPosX = 400 + lc.initialScroll;
        camPosY = 260;
    }

    function createPlayer(playerInfo) {
        myPlayerInfo = playerInfo;

        playerCollision =  inGame.physics.add.image(0, 110, 'avatarCollider');
        player = inGame.add.sprite(0, 0, 'body-' +  playerInfo.avatar['skinTone']);
        head = inGame.add.sprite(0, 0, 'face-' +  playerInfo.avatar['skinTone']);
        eyes = inGame.add.sprite(0, 0, 'eyes-' +  playerInfo.avatar['eyeType']);
        lips = inGame.add.sprite(0, 0, 'lips-0');

        board = inGame.add.sprite(0, 0, 'n-5-' + playerInfo.avatar['equipped'][5]);

        hairUpper = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-1');
        hairLower = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-2');
        
        if (playerInfo.avatar['equipped'][3] === -1) {
            bottomItem = inGame.add.sprite(0, 0, 'f-2-' + playerInfo.avatar['equipped'][2]);
            topItem = inGame.add.sprite(0, 0, 'f-1-' + playerInfo.avatar['equipped'][1]);
        }
        else {
            bottomItem = inGame.add.sprite(0, 0, 'null');
            topItem = inGame.add.sprite(0, 0, 'f-3-' + playerInfo.avatar['equipped'][3]);
        }

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

        container.add([playerCollision, head, eyes, lips, board, hairLower, hairUpper, brow, player, bottomItem, topItem, shoes, usernameTag, usernameLabel]);

        inGame.physics.add.existing(container, false);

        container.setDepth(container.y);
        
        // container.body.setCollideWorldBounds(true);
        // playerCollision.body.setCollideWorldBounds(false);

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

        var otherBottomItem, otherTopItem;

        if (playerInfo.avatar['equipped'][3] === -1) {
            otherBottomItem = inGame.add.sprite(playerInfo.x, playerInfo.y, 'f-2-' + playerInfo.avatar['equipped'][2]);
            otherTopItem = inGame.add.sprite(playerInfo.x, playerInfo.y, 'f-1-' + playerInfo.avatar['equipped'][1]);
        }
        else {
            otherBottomItem = inGame.add.sprite(playerInfo.x, playerInfo.y, 'null');
            otherTopItem = inGame.add.sprite(playerInfo.x, playerInfo.y, 'f-3-' + playerInfo.avatar['equipped'][3]);
        }

        
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

    // Everyone removes the player with this id
    globalThis.socket.on('removePlayer', function (id) {
        console.log("received remove player msg");
        for (let i = 0; i < otherPlayers.getLength(); i++) {
            var p = otherPlayers.getChildren()[i];

            console.log('otherplayer id: ' + p.getData('username'));
            console.log('id, pid' + id + ',' + p.id);
            if (id === p.id) {

                var msgData = p.getData('messageData');
                if (msgData['hasMessage']) {
                    msgData['otherBubbleLifeTime'].stop();
                    msgData['otherMessageLifeTime'].stop();
                    msgData['otherChatBubble'].destroy();
                    msgData['otherChatMessage'].destroy();
                }

                for (let j = 0; j < numContainerItems; j++) {
                    p.x[j].destroy();
                    p.y[j].destroy();
                }

                p.setVisible(false);
                p.destroy();
                otherPlayers.remove(p);
                
            }
        }
    });

    // Sent only to one person, who removes everyone else
    globalThis.socket.on('removePlayers', function () {

        for (let i = 0; i < otherPlayers.getLength(); i++) {
            var p = otherPlayers.getChildren()[i];

                var msgData = p.getData('messageData');
                if (msgData['hasMessage']) {
                    msgData['otherBubbleLifeTime'].stop();
                    msgData['otherMessageLifeTime'].stop();
                    msgData['otherChatBubble'].destroy();
                    msgData['otherChatMessage'].destroy();
                }

                for (let j = 0; j < numContainerItems; j++) {
                    p.x[j].destroy();
                    p.y[j].destroy();
                }
                p.destroy();
                otherPlayers.remove(p);
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
        if (disableInput) return;
        console.log("POINTER IS DOWN");
        isTyping = false;
        globalInputChat.value = defaultChatBarMessage;
        globalInputChat.blur();
        
        globalPointer.x = pointer.x + clickOffsetX;
        globalPointer.y = pointer.y;
        inGame.physics.moveTo(container, globalPointer.x, globalPointer.y - clickOffsetY, 150);
        // moveXY(pointer.x, pointer.y - clickOffsetY);
    });
    // EXAMPLE
    // var tempNamespace = {};
    // var myString = "crystal";

    // tempNamespace[myString] = this.add.sprite(400, 260, 'body-0');;

    // tempNamespace[myString].play('body-0-jump');

    // this.physics.world.on('worldbounds', function() {
    //     stopMoving = true;
    //     container.body.setVelocity(0);
    // });
}

var tween;
var movedRight = false;

function moveX(currentPosX, currentPosY, direction) {
    if (stopMoving)
        return;
	tween = inGame.tweens.add({
        targets: container,
        x: currentPosX + direction*70,
        y: currentPosY,
        ease: 'Linear',
        duration: 500,
    });
}

function moveY(currentPosX, currentPosY, direction) {
	tween = inGame.tweens.add({
        targets: container,
        x: currentPosX,
        y: currentPosY + direction*70,
        ease: 'Linear',
        duration: 500,
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
    // Camera can't pan if already panning
    this.cameras.main.on('camerapancomplete', function () {
        setTimeout(function () {
            isPanning = false;
        }, 0);
    });

    // Change rooms test
    // if (keySpace.isDown) {
    //     console.log("hi, moving to new room...");
    //     socket.emit('changeRoom', "beach");
    //     bg.destroy();
    //     bg = this.add.image(400, 260, 'beachBg');
    // }

    let panDistance = 450;

    // Player input
    if (container) {
        clickOffsetX = this.cameras.main.scrollX;

        if (container.x < leftBound && isPanning === false) {
            
            isPanning = true;
            leftBound -= panDistance;
            rightBound -= panDistance;
            camPosX -= panDistance;
            // clickOffsetX -= 400;
            this.cameras.main.pan(camPosX, camPosY, 1500);
        }
        else if (container.x > rightBound && isPanning === false) {

            isPanning = true;
            leftBound += panDistance;
            rightBound += panDistance;
            camPosX += panDistance;
            // clickOffsetX += 400;
            this.cameras.main.pan(camPosX, camPosY, 1500);
        }

        // if (Phaser.Geom.Intersects.RectangleToRectangle(playerCollision, leftBound))
        //     console.log('hit left bound');
        container.setDepth(container.y);

        if (!disableInput) {
        //#region Arrow Key Movement
        // Horizontal movement
            if (keyLeft.isDown) {
                container.body.setVelocity(0);
                moveX(container.x, container.y, -1);
                
                // // camera left test
                // if (camPosX > -400 && isPanning === false) {
                //     // console.log(camPosX);
                    // isPanning = true;
                    // camPosX -= 400;
                    // clickOffsetX -= 400;
                    // this.cameras.main.pan(camPosX, camPosY, 1500);
                // }

            } else if (keyRight.isDown) {
                container.body.setVelocity(0);
                moveX(container.x, container.y, 1);
                console.log(camPosX);
                // camera right test
                // if (camPosX < 1200 && isPanning == false) {
                //     isPanning = true;
                //     camPosX += 400;
                //     clickOffsetX += 400;
                //     this.cameras.main.pan(camPosX, camPosY, 1500);
                // }
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

            // Actions
        if (key1.isDown) {

            console.log(container.x);

            if (!player.anims.isPlaying && !eyes.anims.isPlaying) {
                globalThis.socket.emit('playerWave');
                player.play('body-' + container.getData('skinTone') + '-wave');

                if (container.getData('equipped')[3] === -1)
                    topItem.play('f-1-' + container.getData('equipped')[1] + '-wave');
                else
                    topItem.play('f-3-' + container.getData('equipped')[3] + '-wave');
                    
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

                if (container.getData('equipped')[3] === -1)
                    topItem.play('f-1-' + container.getData('equipped')[1] + '-cry');
                else
                    topItem.play('f-3-' + container.getData('equipped')[3] + '-cry');
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

                if (container.getData('equipped')[3] === -1)
                    topItem.play('f-1-' + container.getData('equipped')[1] + '-jump');
                else
                    topItem.play('f-3-' + container.getData('equipped')[3] + '-jump');
                
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
        }

        // Click Movement
        var distance = Phaser.Math.Distance.Between(container.x, container.y, globalPointer.x, globalPointer.y - clickOffsetY);

        if (container.body.speed > 0)
        {
            if (distance < 4)
            {
                container.body.reset(globalPointer.x, globalPointer.y - clickOffsetY);
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

        // let camDiff = 400;
        // if (container.x < leftBound) {
        //     // camera left test
        //         if (camPosX > -100 && isPanning === false) {
        //             // console.log(camPosX);
        //             isPanning = true;
        //             camPosX -= camDiff;

        //             // if (camPosX < -100) {
        //             //     clickOffsetX = camPosX + 100;
        //             //     camPosX = -100;
        //             // }
        //             // else {
        //             //     clickOffsetX -= camDiff;
        //             // }
                        
        //             clickOffsetX -= camDiff;
        //             this.cameras.main.pan(camPosX, camPosY, 1500);
        //             leftBound -= camDiff;
        //             rightBound -= camDiff;
        //         }
        // }
        // else if (container.x > rightBound) {
        //     // camera right test
        //         if (camPosX < 1600 && isPanning == false) {
        //             isPanning = true;
        //             camPosX += camDiff;
        //             clickOffsetX += camDiff;
        //             this.cameras.main.pan(camPosX, camPosY, 1500);
        //             leftBound += camDiff;
        //             rightBound += camDiff;
        //         }
        // }
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
    scene: [login, loading, inGame, uiScene]
};

var game = new Phaser.Game(config);