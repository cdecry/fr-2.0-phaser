// Map container child name to index
const cMap = {
    head: 0,
    eyes: 1,
    lips: 2,
    faceAcc: 3,
    board: 4,
    hairLower: 5,
    hairUpper: 6,
    brow: 7,
    headAcc: 8,
    player: 9,
    shoes: 10,
    bottom: 11,
    top: 12,
    outfit: 13,
    bodyAcc: 14,
    usernameTag: 15,
    usernameLabel: 16
}
// Map item type id to container index
const iMap = {
    0: [5, 6],
    1: cMap.top,
    2: cMap.bottom,
    3: cMap.outfit,
    4: cMap.shoes,
    5: cMap.board,
    6: cMap.headAcc,
    7: cMap.faceAcc,
    8: cMap.bodyAcc,
}

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
var numContainerItems = 17;
var chatBubbleOffsetY = -125;
var globalInputChat;

var disableInput = false;
var stopMoving = false;
var container;
var player = null;
var rightBound;
var locationBounds; // list of object of bounds (cannot go to ex: [{ startX: 5, startY: 5, endX: 205, endY: 105 } ]
var head, eyes, brow, lips, hairUpper, hairLower, bottomItem, topItem, shoes, board, usernameTag, usernameLabel, faceAcc, headAcc, bodyAcc, outfit;
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
}

uiScene.create = function() {

    function createAvatarPreview(playerInfo) {

        bodyPreview = uiScene.add.sprite(0, 0, 'body-' +  playerInfo.avatar['skinTone']);
        headPreview = uiScene.add.sprite(0, 0, 'face-' +  playerInfo.avatar['skinTone']);
        eyesPreview = uiScene.add.sprite(0, 0, 'eyes-' +  playerInfo.avatar['eyeType']);
        lipsPreview = uiScene.add.sprite(0, 0, 'lips-0');
        faceAccPreview = uiScene.add.sprite(playerInfo.x, playerInfo.y, playerInfo.avatar['gender'] + '-7-' + playerInfo.avatar['equipped'][7]);
        boardPreview = uiScene.add.sprite(0, 0, 'n-5-' + playerInfo.avatar['equipped'][5]);
        hairLowerPreview = uiScene.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-2');
        hairUpperPreview = uiScene.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-1');
        headAccPreview = uiScene.add.sprite(playerInfo.x, playerInfo.y, playerInfo.avatar['gender'] + '-6-' + playerInfo.avatar['equipped'][6]);
        shoesPreview = uiScene.add.sprite(0, 0, playerInfo.avatar['gender'] + '-4-' + playerInfo.avatar['equipped'][4]);
        // if (playerInfo.avatar['equipped'][3] === -1) {
        bottomItemPreview = uiScene.add.sprite(0, 0, 'f-2-' + playerInfo.avatar['equipped'][2]);
        topItemPreview = uiScene.add.sprite(0, 0, 'f-1-' + playerInfo.avatar['equipped'][1]);
        // }
        // else {
        //     bottomItemPreview = uiScene.add.sprite(0, 0, 'nullItem');
        //     topItemPreview = uiScene.add.sprite(0, 0, 'f-3-' + playerInfo.avatar['equipped'][3]);
        // }
        outfitPreview = uiScene.add.sprite(0, 0, playerInfo.avatar['gender'] + '-3-' + playerInfo.avatar['equipped'][3]);
        bodyAccPreview = uiScene.add.sprite(0, 0, playerInfo.avatar['gender'] + '-8-' + playerInfo.avatar['equipped'][8]);
        browPreview = uiScene.add.sprite(0, 0, 'brow-0');
        usernameTagPreview = uiScene.add.sprite(0, 0, 'username-tag');
        usernameLabelPreview = uiScene.add.text(0, 100, playerInfo.username, { fontFamily: 'usernameFont', fontSize: '15px', fill: "#000000" });
        usernameLabelPreview.originX = 0.5;
        usernameLabelCenter = usernameLabel.getCenter().x;
        usernameLabelPreview.x = usernameLabelCenter;
        usernameLabelPreview.setStroke('#ffffff', 2);
        
        var children  = [headPreview, eyesPreview, lipsPreview, faceAccPreview, boardPreview, hairLowerPreview, hairUpperPreview, browPreview, headAccPreview, bodyPreview, shoesPreview, bottomItemPreview, topItemPreview, outfitPreview, bodyAccPreview, usernameTagPreview, usernameLabelPreview];
        avatarPreview = uiScene.add.container(0, 0);
        avatarPreview.add(children);
        avatarPreview.setDepth(1001);

        avatarPreview.setDataEnabled();
        avatarPreview.setData('username', playerInfo.username);
        avatarPreview.setData('skinTone', playerInfo.avatar['skinTone']);
        avatarPreview.setData('eyeType', playerInfo.avatar['eyeType']);
        avatarPreview.setData('gender', playerInfo.avatar['gender']);
        var previewEquipped = [];
        for (let i = 0; i < playerInfo.avatar['equipped'].length; i++)
            previewEquipped[i] = playerInfo.avatar['equipped'][i]
        avatarPreview.setData('equipped', previewEquipped);
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

                // Send request to equip all items on avatar preview:
                if (avatarPreview.getData('equipped') != null)
                    globalThis.socket.emit('changeClothes', avatarPreview.getData('equipped'));
                
                avatarPreview.destroy();
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
            item.setInteractive();
            item.setDepth(1001);

            // equip item on avatar preview
            item.on('pointerdown', () => {
                equipItem(avatarPreview, typeId, myInventory[typeId][i].id);
            });

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

    // Equip the container
    function equipItem(cont, typeId, itemId) {
        var equippedItem;

        if (typeId == 0) {
            equippedItem = uiScene.add.sprite(0, 0, 'f-'+ typeId.toString()+ '-' + itemId.toString() + '-1');
            var equippedItem2 = uiScene.add.sprite(0, 0, 'f-'+ typeId.toString()+ '-' + itemId.toString() + '-2');
            cont.replace(cont.getAt(5), equippedItem, true);
            cont.replace(cont.getAt(6), equippedItem2, true);
        }
        else {
            equippedItem = uiScene.add.sprite(0, 0, 'f-'+ typeId.toString()+ '-' + itemId.toString());
            cont.replace(cont.getAt(iMap[i]), equippedItem);
        }

        var updateItemEquipped = cont.getData('equipped');
        updateItemEquipped[typeId] = itemId;

        cont.setData('equipped', updateItemEquipped);
    }

    function loadInventory() {
        // Call the functions to create the initial inventory items and navigation buttons
        createNavigationButtons(0);
        createInventoryItems(0);
        createAvatarPreview(myPlayerInfo);
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

    // load null items:
    this.load.spritesheet('f-1--1', 'item/null.png', { frameWidth: 300, frameHeight: 250 });
    this.load.spritesheet('f-2--1', 'item/null.png', { frameWidth: 300, frameHeight: 250 });
    this.load.spritesheet('f-3--1', 'item/null.png', { frameWidth: 300, frameHeight: 250 });
    this.load.spritesheet('f-6--1', 'item/null.png', { frameWidth: 300, frameHeight: 250 });
    this.load.spritesheet('f-7--1', 'item/null.png', { frameWidth: 300, frameHeight: 250 });
    this.load.spritesheet('f-8--1', 'item/null.png', { frameWidth: 300, frameHeight: 250 });

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
    this.load.spritesheet('nullItem', 'item/null.png', { frameWidth: 300, frameHeight: 250 });

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

        head = inGame.add.sprite(0, 0, 'face-' +  playerInfo.avatar['skinTone']);
        eyes = inGame.add.sprite(0, 0, 'eyes-' +  playerInfo.avatar['eyeType']);
        lips = inGame.add.sprite(0, 0, 'lips-0');
        faceAcc = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-7-' + playerInfo.avatar['equipped'][7]);
        board = inGame.add.sprite(0, 0, 'n-5-' + playerInfo.avatar['equipped'][5]);
        hairLower = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-2');
        hairUpper = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-1');
        headAcc = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-6-' + playerInfo.avatar['equipped'][6]);
        brow = inGame.add.sprite(0, 0, 'brow-0');
        player = inGame.add.sprite(0, 0, 'body-' +  playerInfo.avatar['skinTone']);
        shoes = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-4-' + playerInfo.avatar['equipped'][4]);
        bottomItem = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-2-' + playerInfo.avatar['equipped'][2]);
        topItem = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-1-' + playerInfo.avatar['equipped'][1]);

        outfit = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-3-' + playerInfo.avatar['equipped'][3]);
        bodyAcc = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-8-' + playerInfo.avatar['equipped'][8]);
        
        usernameTag = inGame.add.sprite(0, 0, 'username-tag');

        usernameLabel = inGame.add.text(0, 100, playerInfo.username, { fontFamily: 'usernameFont', fontSize: '15px', fill: "#000000" });
        usernameLabel.originX = 0.5;
        usernameLabelCenter = usernameLabel.getCenter().x;
        usernameLabel.x = usernameLabelCenter;
        usernameLabel.setStroke('#ffffff', 2);
    
        container = inGame.add.container(playerInfo.x, playerInfo.y);
        container.setSize(300, 250);

        container.add([head, eyes, lips, faceAcc, board, hairLower, hairUpper, brow, headAcc, player, shoes, bottomItem, topItem, outfit, bodyAcc, usernameTag, usernameLabel]);
        inGame.physics.add.existing(container, false);

        container.setDepth(container.y);

        container.setDataEnabled();
        container.setData('username', playerInfo.username);
        container.setData('skinTone', playerInfo.avatar['skinTone']);
        container.setData('eyeType', playerInfo.avatar['eyeType']);
        container.setData('gender', playerInfo.avatar['gender']);
        container.setData('equipped', playerInfo.avatar['equipped']);
    }

    function addOtherPlayers(playerInfo) {
        
        const otherEyes = inGame.add.sprite(0, 0, 'eyes-' + playerInfo.avatar['eyeType']);
        const otherLips = inGame.add.sprite(0, 0, 'lips-0');
        var otherFaceAcc = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-7-' + playerInfo.avatar['equipped'][7]);
        const otherBoard = inGame.add.sprite(0, 0, 'n-5-' + playerInfo.avatar['equipped'][5]);
        const otherHairLower = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-2');
        const otherHairUpper = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-1');
        const otherBrow = inGame.add.sprite(0, 0, 'brow-0');
        var otherHeadAcc = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-6-' + playerInfo.avatar['equipped'][6]);
        const otherPlayer = inGame.add.sprite(0, 0, 'body-' + playerInfo.avatar['skinTone']);
        const otherShoes = inGame.add.sprite(0, 0, 'f-4-' + playerInfo.avatar['equipped'][4]);
        var otherBottomItem, otherTopItem;
        otherBottomItem = inGame.add.sprite(0, 0, 'f-2-' + playerInfo.avatar['equipped'][2]);
        otherTopItem = inGame.add.sprite(0, 0, 'f-1-' + playerInfo.avatar['equipped'][1]);

        var otherOutfit = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-3-' + playerInfo.avatar['equipped'][3]);
        var otherBodyAcc = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-8-' + playerInfo.avatar['equipped'][8]);
    
        var otherUsernameTag = inGame.add.sprite(0, 0, 'username-tag');
        var otherUsernameLabel = inGame.add.text(0, 0 + 100, playerInfo.username, { fontFamily: 'usernameFont', fontSize: '15px', fill: "#000000" });
        const otherHead = inGame.add.sprite(0, 0, 'face-' + playerInfo.avatar['skinTone']);
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

        var orderItems = [otherHead, otherEyes, otherLips, otherFaceAcc, otherBoard, otherHairLower, otherHairUpper, otherBrow, otherHeadAcc, otherPlayer, otherShoes, otherBottomItem, otherTopItem, otherOutfit, otherBodyAcc, otherUsernameTag, otherUsernameLabel];

        const otherContainer = inGame.add.container(playerInfo.x, playerInfo.y);

        otherContainer.add([otherHead, otherEyes, otherLips, otherFaceAcc, otherBoard, otherHairLower, otherHairUpper, otherBrow, otherHeadAcc, otherPlayer, otherShoes, otherBottomItem, otherTopItem, otherOutfit, otherBodyAcc, otherUsernameTag, otherUsernameLabel]);

        otherContainer.setDepth(playerInfo.y);

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

                p.removeAll(true);
                otherPlayers.remove(p);
                p.destroy();
                
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
                    p.getAt(j).destory();
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

                p.setPosition(playerInfo.x, playerInfo.y);
                p.setDepth(playerInfo.y);
                p.flipX = playerInfo.flipX;
                
                for (let i = 0; i < 15; i++)
                    p.getAt(i).flipX = p.flipX;

            }
            }.bind(this));
        }
    }.bind(this));

    globalThis.socket.on('changeClothesResponse', function (pid, changed) {
        console.log("recieved change clothes response.");

        if (pid == myPlayerInfo.id) {
            for (let i = 0; i < Object.keys(changed).length; i++) {
                if (changed[i].length > 0) {
                    changeClothes(container, i, changed[i][0].id, true);
                }
            }
            return;
        }

        otherPlayers.getChildren().forEach(function (p) {
            console.log("checking here");
            if (pid === p.id) {
                console.log("found the bastard");
                for (let i = 0; i < Object.keys(changed).length; i++) {
                    console.log("looking for changed");
                    console.log(JSON.stringify(changed[i]));
                    console.log(changed[i].length);
                    if (changed[i].length > 0) {
                        console.log("equipping!");
                        changeClothes(p, i, changed[i][0].id, false);
                    }
                }
            }
        }.bind(this));
    }.bind(this));

    function changeClothes(cont, typeId, itemId, isLocalPlayer) {
        var equipHairLower = inGame.add.sprite(0, 0, 'f-'+ typeId.toString()+ '-' + itemId.toString() + '-1');
        var equipHairUpper = inGame.add.sprite(0, 0, 'f-'+ typeId.toString()+ '-' + itemId.toString() + '-2');
        // ITEM MAP GUIDE
        // head eyes lips faceAcc board hairLower hairUpper brow headAcc player shoes bottomItem topItem outfit bodyAcc usernameTag usernameLabel
        // 0    1,   2,   3,      4,    5,        6,        7    8       9      10    11         12      13     14      15          16
        if (isLocalPlayer) {
            hairLower = equipHairLower;
            hairUpper = equipHairUpper;
            cont.replace(cont.getAt(5), equipHairLower, true);
            cont.replace(cont.getAt(6), equipHairUpper, true);
            equipHairLower.flipX = player.flipX;
            equipHairUpper.flipX = player.flipX;
        }
        else {
            var deleteLower = cont.getAt(5);
            var deleteUpper = cont.getAt(6);
            cont.replace(cont.getAt(5), equipHairLower, true);
            cont.replace(cont.getAt(6), equipHairUpper, true);
            equipHairLower.x = cont.getAt(0).x;
            equipHairLower.y = cont.getAt(0).y;
            equipHairUpper.x = cont.getAt(0).x;
            equipHairUpper.y = cont.getAt(0).y;
            equipHairLower.flipX = cont.flipX;
            equipHairUpper.flipX = cont.flipX;
            // equipHairLower.setDepth(1);
            // equipHairUpper.setDepth(2);
            // var oldItemX = cont.x[5].x;
            // var oldItemY = cont.y[5].y;
            
        }
        var updateItemEquipped = cont.getData('equipped');
        updateItemEquipped[typeId] = itemId;
        
        cont.setData('equipped', updateItemEquipped);
    }

    globalThis.socket.on('playerWaveResponse', function (playerInfo) {
        otherPlayers.getChildren().forEach(function (p) {
            if (playerInfo.id === p.id) { // && !p.x[7].anims.isPlaying && !p.x[1].anims.isPlaying
                p.getAt(9).play(JSON.parse(JSON.stringify(p.getAt(9))).textureKey + '-wave');
                p.getAt(2).play(JSON.parse(JSON.stringify(p.getAt(2))).textureKey + '-wave');
                p.getAt(12).play(JSON.parse(JSON.stringify(p.getAt(12))).textureKey + '-wave');
                }
            }.bind(this));
    }.bind(this));

    globalThis.socket.on('playerCryResponse', function (playerInfo) {
        otherPlayers.getChildren().forEach(function (p) {
            if (playerInfo.id === p.id) {
                    for (let i = 0; i < 10; i++) {
                        p.getAt(i).play(JSON.parse(JSON.stringify(p.getAt(i))).textureKey + '-cry');
                    }
                    p.getAt(12).play(JSON.parse(JSON.stringify(p.getAt(12))).textureKey + '-cry');
                    p.getAt(13).play(JSON.parse(JSON.stringify(p.getAt(13))).textureKey + '-cry');
                    p.getAt(14).play(JSON.parse(JSON.stringify(p.getAt(14))).textureKey + '-cry');
                }
            }.bind(this));
    }.bind(this));

    globalThis.socket.on('playerJumpResponse', function (playerInfo) {
        otherPlayers.getChildren().forEach(function (p) {
            if (playerInfo.id === p.id) {
                    for (let i = 0; i < 4; i++) {
                        p.getAt(i).play(JSON.parse(JSON.stringify(p.getAt(i))).textureKey + '-jump');
                    }
                    for (let i = 5; i < 16; i++) {
                        p.getAt(i).play(JSON.parse(JSON.stringify(p.getAt(i))).textureKey + '-jump');
                    }
                }
            }.bind(this));
    }.bind(this));

    globalThis.socket.on('playerWinkResponse', function (playerInfo) {
        otherPlayers.getChildren().forEach(function (p) {
            if (playerInfo.id === p.id && !p.getAt(9).anims.isPlaying && !p.getAt(1).anims.isPlaying) {
                p.getAt(1).play(JSON.parse(JSON.stringify(p.getAt(1))).textureKey + '-wink');
            }
            }.bind(this));
    }.bind(this));

    globalThis.socket.on('chatMessageResponse', function (playerInfo, msg) {
        otherPlayers.getChildren().forEach(function (p) {
            if (playerInfo.id === p.id && !p.getAt(7).anims.isPlaying && !p.getAt(1).anims.isPlaying) {

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
    if (container)
        console.log("Position debug: " + container.y);

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