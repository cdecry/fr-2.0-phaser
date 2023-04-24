// Map container child name to index
const cMap = {
    hairLower: 0,
    head: 1,
    eyes: 2,
    lips: 3,
    faceAcc: 4,
    boardLower: 5,
    hairUpper: 6,
    brow: 7,
    headAcc: 8,
    player: 9,
    shoes: 10,
    bottom: 11,
    top: 12,
    outfit: 13,
    costume: 14,
    bodyAcc: 15,
    boardUpper: 16,
    usernameTag: 17,
    usernameLabel: 18
}
// Map item type id to container index
const iMap = {
    0: [cMap.hairUpper, cMap.hairLower],
    1: cMap.top,
    2: cMap.bottom,
    3: cMap.outfit,
    4: cMap.shoes,
    5: [cMap.boardLower, cMap.boardUpper],
    6: cMap.headAcc,
    7: cMap.faceAcc,
    8: cMap.bodyAcc,
    9: cMap.costume,
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
    this.load.atlas('outLoading', 'scene/outLoading.png', 'scene/loading.json');
}

loading.create = function() {
    const sprite = this.add.sprite(400, 260, 'outLoading', 'loading-0');
    const animConfig = {
        key: 'outLoad',
        frames: 'outLoading',
        frameRate: 12,
        repeat: -1,
    };
    
    this.anims.create(animConfig);
    sprite.play('outLoad');

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
var numContainerItems = 19;
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
var locationObjects = [];
var bgm;

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
    // Load chat ui
    this.load.html('chatBar', 'html/chatbar.html');
    this.load.html('messageWidth', 'html/messagewidth.html');
    this.load.html('chatMessageHTML', 'html/chatmessage.html');
    this.load.html('instantMessengerHTML', 'html/instantmessenger.html');
    this.load.image('uiBar', 'scene/chat/ui-bar.png');
    // Load inventory ui
    this.load.image('inventoryHairTab', 'scene/ui/inventoryHairTab.png');
    this.load.image('inventoryClothesTab', 'scene/ui/inventoryClothesTab.png');
    this.load.image('inventoryBoardTab', 'scene/ui/inventoryBoardTab.png');
    this.load.image('inventoryAccessoryTab', 'scene/ui/inventoryAccessoryTab.png');
    this.load.image('inventoryArrowUp', 'scene/ui/inventoryArrowUp.png');
    this.load.image('inventoryArrowDown', 'scene/ui/inventoryArrowDown.png');
    this.load.html('inventoryButton', 'html/inventoryButton.html');
    this.load.html('inventoryUI', 'html/inventoryUI.html');
    // Load IDFone ui
    this.load.image('idfoneUpper', 'scene/ui/idfone/idfoneUpper.png');
    this.load.image('idfoneLower', 'scene/ui/idfone/idfoneLower.png');
    this.load.image('idfoneShadow', 'scene/ui/idfone/idfoneShadow.png');
    this.load.image('idfoneDefault', 'scene/ui/idfone/wallpaper/default.png');

    this.load.spritesheet('inLoading', 'scene/ui/inLoading.png', { frameWidth: 129, frameHeight: 129 });
    this.load.image('loadingScreen', 'scene/ui/loadingScreen.png');
    this.load.image('transparentScreen', 'scene/ui/transparentScreen.png');
    this.load.image('greyScreen', 'scene/ui/greyScreen.png');
    this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
    //this.load.image('nullItem', 'item/null.png', { frameWidth: 300, frameHeight: 250 });
}

uiScene.create = function() {

    this.input.setTopOnly(true);
    function createAvatarPreview(playerInfo) {

        bodyPreview = uiScene.add.sprite(0, 0, playerInfo.avatar.gender + '-body-' +  playerInfo.avatar['skinTone']);
        headPreview = uiScene.add.sprite(0, 0, playerInfo.avatar['gender']  + '-face-' +  playerInfo.avatar['skinTone']);
        eyesPreview = uiScene.add.sprite(0, 0, playerInfo.avatar['gender'] + '-eyes-' +  playerInfo.avatar['eyeType']);
        lipsPreview = uiScene.add.sprite(0, 0, 'lips-0');
        faceAccPreview = uiScene.add.sprite(playerInfo.x, playerInfo.y, playerInfo.avatar['gender'] + '-7-' + playerInfo.avatar['equipped'][7]);
        boardLowerPreview = uiScene.add.sprite(0, 0, 'n-5-' + playerInfo.avatar['equipped'][5] + '-1');
        hairLowerPreview = uiScene.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-2');
        hairUpperPreview = uiScene.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-1');
        headAccPreview = uiScene.add.sprite(playerInfo.x, playerInfo.y, playerInfo.avatar['gender'] + '-6-' + playerInfo.avatar['equipped'][6]);
        shoesPreview = uiScene.add.sprite(0, 0, playerInfo.avatar['gender'] + '-4-' + playerInfo.avatar['equipped'][4]);
        // if (playerInfo.avatar['equipped'][3] === -1) {
        bottomItemPreview = uiScene.add.sprite(0, 0, playerInfo.avatar['gender']  + '-2-' + playerInfo.avatar['equipped'][2]);
        topItemPreview = uiScene.add.sprite(0, 0, playerInfo.avatar['gender']  + '-1-' + playerInfo.avatar['equipped'][1]);
        outfitPreview = uiScene.add.sprite(0, 0, playerInfo.avatar['gender'] + '-3-' + playerInfo.avatar['equipped'][3]);
        costumePreview = uiScene.add.sprite(0, 0, playerInfo.avatar['gender'] + '-9-' + playerInfo.avatar['equipped'][9]);
        bodyAccPreview = uiScene.add.sprite(0, 0, playerInfo.avatar['gender'] + '-8-' + playerInfo.avatar['equipped'][8]);
        browPreview = uiScene.add.sprite(0, 0, 'brow-0');
        boardUpperPreview = uiScene.add.sprite(0, 0, 'n-5-' + playerInfo.avatar['equipped'][5] + '-2');
        usernameTagPreview = uiScene.add.sprite(0, 0, 'username-tag');
        usernameLabelPreview = uiScene.add.text(0, 100, playerInfo.username, { fontFamily: 'usernameFont', fontSize: '15px', fill: "#000000" });
        usernameLabelPreview.originX = 0.5;
        usernameLabelCenter = usernameLabel.getCenter().x;
        usernameLabelPreview.x = usernameLabelCenter;
        usernameLabelPreview.setStroke('#ffffff', 2);
        
        var children  = [hairLowerPreview, headPreview, eyesPreview, lipsPreview, faceAccPreview, boardLowerPreview, hairUpperPreview, browPreview, headAccPreview, bodyPreview, shoesPreview, bottomItemPreview, topItemPreview, outfitPreview, costumePreview, bodyAccPreview, boardUpperPreview, usernameTagPreview, usernameLabelPreview];
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
    var inventory = this.add.image(400, 260, 'inventoryHairTab');
    var inventoryUI = this.add.dom(0,0).createFromCache('inventoryUI');
    var inventoryButton = this.add.dom(152, 490).createFromCache('inventoryButton');
    
    inventory.setDepth(1000);
    inventory.setVisible(false);
    inventoryUI.setVisible(false);
    uiBar.setInteractive({ pixelPerfect: true});

    var chatBar = this.add.dom(185, 470).createFromCache('chatBar');
    var inputChat = chatBar.getChildByName('chatInput');
    globalInputChat = inputChat;
    var defaultChatBarMessage = "Click Here Or Press ENTER To Chat";

    setTimeout(() => {
        inputChat.value = defaultChatBarMessage;
    }, 800);

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

    this.input.setTopOnly(true);
    chatBar.addListener('pointerdown');
    chatBar.on('pointerdown', function (event) {
        uiScene.input.stopPropagation();
        inGame.input.stopPropagation();
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

        var greyScreen = uiScene.add.image(400, 260, 'greyScreen');
        var inLoading = uiScene.add.sprite(400, 260, 'inLoading').play('inLoad');

        uiScene.input.manager.setCursor({ cursor: 'default' });
        greyScreen.setInteractive({ useHandCursor: false });

        greyScreen.setDepth(1010);
        inLoading.setDepth(1010);

        uiBar.setDepth(0);
        chatBar.setDepth(0);
        disableInput = true;

        setTimeout(function () {
            openInventory();
        }, 400);

        setTimeout(function () {
            inLoading.destroy();
            greyScreen.destroy();
        }, 700);
        function openInventory() {
            inventory.setTexture('inventoryHairTab');
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
                else if (event.target.id === 'hairButton') {
                    inventoryUI.getChildByID('clothesSubtabs').style.visibility = 'hidden';
                    inventory.setTexture('inventoryHairTab');
                    // hair
                    gridWidth = 8;
                    gridHeight = 3;
                    cellWidth = 62;
                    cellHeight = 110;
                    gridX = 70;
                    createNavigationButtons(0);
                    createInventoryItems(0);
                }
                else if (event.target.id === 'clothesButton' || event.target.id === 'topButton') {
                    inventoryUI.getChildByID('clothesSubtabs').style.visibility = 'visible';
                    inventory.setTexture('inventoryClothesTab');
                    // default tops
                    gridWidth = 8;
                    gridHeight = 3;
                    cellWidth = 62;
                    cellHeight = 110;
                    gridX = 70;
                    createNavigationButtons(1);
                    createInventoryItems(1);
                }
                else if (event.target.id === 'bottomButton') {
                    gridWidth = 8;
                    gridHeight = 3;
                    cellWidth = 62;
                    cellHeight = 110;
                    gridX = 70;
                    createNavigationButtons(2);
                    createInventoryItems(2);
                }

                else if (event.target.id === 'outfitsButton') {
                    gridWidth = 8;
                    gridHeight = 3;
                    cellWidth = 62;
                    cellHeight = 110;
                    gridX = 70;
                    createNavigationButtons(3);
                    createInventoryItems(3);
                }

                else if (event.target.id === 'costumesButton') {
                    // FIX
                    gridWidth = 8;
                    gridHeight = 3;
                    cellWidth = 62;
                    cellHeight = 110;
                    gridX = 70;
                    createNavigationButtons(1);
                    createInventoryItems(1);
                }

                else if (event.target.id === 'shoesButton') {
                    gridWidth = 8;
                    gridHeight = 3;
                    cellWidth = 62;
                    cellHeight = 110;
                    gridX = 70;
                    createNavigationButtons(4);
                    createInventoryItems(4);
                }
                else if (event.target.id === 'boardButton') {
                    inventoryUI.getChildByID('clothesSubtabs').style.visibility = 'hidden';
                    inventory.setTexture('inventoryBoardTab');
                    gridWidth = 4;
                    gridHeight = 3;
                    cellWidth = 124;
                    cellHeight = 110;
                    gridX = 100;
                    createNavigationButtons(5);
                    createInventoryItems(5);
                }
                else if (event.target.id === 'accessoryButton') {
                    inventoryUI.getChildByID('clothesSubtabs').style.visibility = 'hidden';
                    inventory.setTexture('inventoryAccessoryTab');
                    gridWidth = 8;
                    gridHeight = 3;
                    cellWidth = 62;
                    cellHeight = 110;
                    gridX = 70;
                    createNavigationButtons(7);
                    createInventoryItems(7)
                }
            });
        }
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

        var prefix = "n"

        if (typeId != 5)
            prefix = myPlayerInfo.avatar['gender'];

        // Create the items for the current page
        for (let i = startIndex; i < endIndex; i++) {
            var item;
            
            item = uiScene.add.sprite(0, 0, prefix + '-' + typeId.toString()+ '-' + myInventory[typeId][i].id.toString() + '-i');
            console.log(prefix + '-' + typeId.toString()+ '-' + myInventory[typeId][i].id.toString() + '-i');

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
        if (prevButton)
            prevButton.destroy();
        if (nextButton)
            nextButton.destroy();

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
        var updateItemEquipped = cont.getData('equipped');

        var prefix = 'n';
        if (typeId != 5)
            prefix = myPlayerInfo.avatar.gender;

        if (typeId == 0 || typeId == 5 && itemId != -1) {
            equippedItem = uiScene.add.sprite(0, 0, prefix + '-'+ typeId.toString()+ '-' + itemId.toString() + '-1');
            var equippedItem2 = uiScene.add.sprite(0, 0, prefix + '-'+ typeId.toString()+ '-' + itemId.toString() + '-2');
            cont.replace(cont.getAt(iMap[typeId][0]), equippedItem, true);
            cont.replace(cont.getAt(iMap[typeId][1]), equippedItem2, true);
        }
        else {
            equippedItem = uiScene.add.sprite(0, 0, prefix + '-'+ typeId.toString()+ '-' + itemId.toString());
            cont.replace(cont.getAt(iMap[typeId]), equippedItem, true);
        }

        if (typeId == 1 && updateItemEquipped[3] != -1) {
            equipItem(cont, 3, -1);
            equipItem(cont, 2, 13);     // default for now
        }
        else if (typeId == 2 && updateItemEquipped[3] != -1) {
            equipItem(cont, 3, -1);
            equipItem(cont, 1, 5);
        }
        else if (typeId == 3 && updateItemEquipped[1] != -1) {
            equipItem(cont, 1, -1);
            equipItem(cont, 2, -1);
        }


        updateItemEquipped[typeId] = itemId;
        cont.setData('equipped', updateItemEquipped);
    }

    function loadInventory() {
        // Call the functions to create the initial inventory items and navigation buttons
        gridWidth = 8;
        gridHeight = 3;
        cellWidth = 62;
        cellHeight = 110;
        gridX = 70;
        createNavigationButtons(0);
        createInventoryItems(0);
        createAvatarPreview(myPlayerInfo);
        avatarPreview.setPosition(675, 250);
    }

    uiScene.load = function(screen, loading, screenType) {
        screen = uiScene.add.image(400, 260, screenType);
        loading = uiScene.add.sprite(400, 260, 'inLoading').play('inLoad');
    }

    uiScene.openIDFone = function(isLocalPlayer, playerInfo) {
        var greyScreen = uiScene.add.image(400, 260, 'greyScreen');
        var inLoading = uiScene.add.sprite(400, 260, 'inLoading').play('inLoad');

        var idfoneLower, idfoneWallpaper, idfoneUpper, idfoneShadow;

        setTimeout(function () {
            idfoneLower = uiScene.add.image(400, 230, 'idfoneLower');
            idfoneWallpaper = uiScene.add.image(400, 260, 'idfoneDefault');
            idfoneUpper = uiScene.add.image(400, 260, 'idfoneUpper');
            idfoneShadow = uiScene.add.image(400, 260, 'idfoneShadow');

            tween = uiScene.tweens.add({
                targets: idfoneLower,
                x: 400,
                y: 260,
                ease: 'Linear',
                duration: 300,
            });

            createAvatarPreview(playerInfo);
            avatarPreview.setPosition(460, 200);

            var closeIDFoneButton = uiScene.add.circle(554, 88, 12, 0x0000ff, 0);
            closeIDFoneButton.setInteractive({ useHandCursor: true });

            var idfoneGroup = [greyScreen, idfoneLower, idfoneWallpaper, idfoneUpper, idfoneShadow, avatarPreview, closeIDFoneButton, inLoading];

            closeIDFoneButton.on('pointerdown', () => {
                for (let i = 0; i < idfoneGroup.length; i++) {
                    idfoneGroup[i].destroy();
                }
            })
        }, 400);
        
        uiScene.input.manager.setCursor({ cursor: 'default' });
        greyScreen.setInteractive({ useHandCursor: false });

        // greyScreen.disableInteractive();
        // idfoneLower.setInteractive();

        uiBar.setDepth(0);
        chatBar.setDepth(0);

        // var closeIDFoneButton = uiScene.add.circle(554, 88, 12, 0x0000ff, 0);
        // closeIDFoneButton.setInteractive({ useHandCursor: true });

        // var idfoneGroup = [greyScreen, idfoneLower, idfoneWallpaper, idfoneUpper, idfoneShadow, avatarPreview, closeIDFoneButton];

        // closeIDFoneButton.on('pointerdown', () => {
        //     for (let i = 0; i < idfoneGroup.length; i++) {
        //         idfoneGroup[i].destroy();
        //     }
        // })
    }

    this.anims.create({
        key: 'inLoad',
        frames: this.anims.generateFrameNumbers('inLoading'),
        frameRate: 40,
        repeat: -1
    });

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
    
    // Load locations and objects
    this.load.image('downtownBg', 'scene/location/downtown/downtown.png');
    this.load.image('topModelsObject', 'scene/location/downtown/objects/topmodels.png');

    this.load.image('topModelsBg', 'scene/location/downtown/topmodels.png');
    this.load.spritesheet('topModelsSean', 'scene/location/downtown/objects/topModelsSean.png', { frameWidth: 105, frameHeight: 100 });
    this.load.spritesheet('topModelsBoa1', 'scene/location/downtown/objects/topModelsBoa1.png', { frameWidth: 52, frameHeight: 108 });
    this.load.spritesheet('topModelsBoa2', 'scene/location/downtown/objects/topModelsBoa2.png', { frameWidth: 52, frameHeight: 108 });
    this.load.spritesheet('topModelsModel', 'scene/location/downtown/objects/topModelsModel.png', { frameWidth: 62, frameHeight: 102 });
    this.load.spritesheet('topModelsReporter1', 'scene/location/downtown/objects/topModelsReporter1.png', { frameWidth: 63, frameHeight: 106 });
    this.load.spritesheet('topModelsReporter2', 'scene/location/downtown/objects/topModelsReporter2.png', { frameWidth: 63, frameHeight: 106 });
    this.load.spritesheet('topModelsReporter3', 'scene/location/downtown/objects/topModelsReporter3.png', { frameWidth: 63, frameHeight: 106 });
    
    this.load.spritesheet('topModelsFan', 'scene/location/downtown/objects/topModelsFan.png', { frameWidth: 49, frameHeight: 132 });
    this.load.image('topModelsPlant', 'scene/location/downtown/objects/topModelsPlant.png');
    this.load.image('topModelsRope1', 'scene/location/downtown/objects/topModelsRope1.png');
    this.load.image('topModelsRope2', 'scene/location/downtown/objects/topModelsRope2.png');
    this.load.image('topModelsDesk', 'scene/location/downtown/objects/topModelsDesk.png');
    this.load.image('topModelsChair', 'scene/location/downtown/objects/topModelsChair.png');

    this.load.image('beachBg', 'scene/location/beach/beach.png');
    // this.load.image('avatarCollider', 'avatar/avatarCollider.png');

    // Load bgm
    this.load.audio('topModelsLobbyBGM', 'bgm/topModelsLobby.mp3');
    this.load.audio('downtownBGM', 'bgm/downtown.mp3');

    // load all avatar bases
    for (let i = 0; i < 6; i++) {
        this.load.spritesheet('m-body-' + i.toString(), 'avatar/m-body-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
        this.load.spritesheet('m-face-' + i.toString(), 'avatar/m-face-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
        this.load.spritesheet('f-body-' + i.toString(), 'avatar/f-body-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
        this.load.spritesheet('f-face-' + i.toString(), 'avatar/f-face-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
    }
    
    // load all avatar eyes
    for (let i = 0; i < 14; i++) {
        this.load.spritesheet('f-eyes-' + i.toString(), 'avatar/f-eyes-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
        this.load.spritesheet('m-eyes-' + i.toString(), 'avatar/m-eyes-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
    }

    // load brows and lips
    this.load.spritesheet('brow-0', 'avatar/brow-0.png', { frameWidth: 300, frameHeight: 250 });
    this.load.spritesheet('lips-0', 'avatar/lips-0.png', { frameWidth: 300, frameHeight: 250 });

    // load items

    // load null items:
    for (let i = 0; i < 10; i++) {
        this.load.spritesheet('f-' + i.toString() + '--1', 'item/null.png', { frameWidth: 300, frameHeight: 250 });
        this.load.spritesheet('m-' + i.toString() + '--1', 'item/null.png', { frameWidth: 300, frameHeight: 250 });
    }
    this.load.spritesheet('f-0--1-1', 'item/null.png', { frameWidth: 300, frameHeight: 250 });
    this.load.spritesheet('f-0--1-2', 'item/null.png', { frameWidth: 300, frameHeight: 250 });
    this.load.spritesheet('m-0--1-1', 'item/null.png', { frameWidth: 300, frameHeight: 250 });
    this.load.spritesheet('m-0--1-2', 'item/null.png', { frameWidth: 300, frameHeight: 250 });
    this.load.spritesheet('nullItem', 'item/null.png', { frameWidth: 300, frameHeight: 250 });

    // load hairs & mannequins
    for (let i = 0; i < 10; i++) {
        this.load.spritesheet('f-0-' + i.toString() + '-1', 'item/f-0-' + i.toString() + '-1.png', { frameWidth: 300, frameHeight: 250 });
        this.load.spritesheet('f-0-' + i.toString() + '-2', 'item/f-0-' + i.toString() + '-2.png', { frameWidth: 300, frameHeight: 250 });
        this.load.image('f-0-' + i.toString() + '-i', 'item/f-0-' + i.toString() + '-i.png');
    }

    // load bottoms
    for (let i = 0; i < 16; i++) {
        this.load.spritesheet('f-2-' + i.toString(), 'item/f-2-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
        this.load.image('f-2-' + i.toString() + '-i', 'item/f-2-' + i.toString() + '-i.png');
    }

    // load tops
    for (let i = 0; i < 16; i++) {
        this.load.spritesheet('f-1-' + i.toString(), 'item/f-1-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
        this.load.image('f-1-' + i.toString() + '-i', 'item/f-1-' + i.toString() + '-i.png');
    }

    // load outfits
    for (let i = 0; i < 13; i++) {
        this.load.spritesheet('f-3-' + i.toString(), 'item/f-3-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
        this.load.image('f-3-' + i.toString() + '-i', 'item/f-3-' + i.toString() + '-i.png');
    }

    // load shoes
    for (let i = 0; i < 5; i++) {
        this.load.spritesheet('f-4-' + i.toString(), 'item/f-4-' + i.toString() + '.png', { frameWidth: 300, frameHeight: 250 });
        this.load.image('f-4-' + i.toString() + '-i', 'item/f-4-' + i.toString() + '-i.png');
    }

    // load boards
    for (let i = 0; i < 5; i++) {
        this.load.spritesheet('n-5-' + i.toString() + '-1', 'item/n-5-' + i.toString() + '-1.png', { frameWidth: 300, frameHeight: 250 });
        this.load.spritesheet('n-5-' + i.toString() + '-2', 'item/n-5-' + i.toString() + '-2.png', { frameWidth: 300, frameHeight: 250 });
        this.load.image('n-5-' + i.toString() + '-i', 'item/n-5-' + i.toString() + '-i.png');
    }

    // load placeholder
    //this.load.image('nullItem', 'item/null.png', { frameWidth: 300, frameHeight: 250 });

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
    },
    topModels: {
        width: 800,
        backgroundX: 0,
        initialScroll: 0,
        playerSpawnX: 300,
        playerSpawnY: 300,
        boundsPolygon: 0    // load json polygon for space player can move around in
    }
}

inGame.create = function() {
    // Init Camera
    setCameraPosition(currentLocation);
    this.scene.launch(uiScene);
    initLocation('downtown');
    // Load background
    bg = this.add.image(400, 260, 'downtownBg');
    bg.setInteractive();
    bg.setDepth(-500);
    this.input.setTopOnly(true);
    bg.on('pointerdown', function (pointer) { clickMovement(pointer); });

    inGame.sound.pauseOnBlur = false;

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

    function initLocation(location) {

        if (location == 'downtown') {
            bgm = inGame.sound.add('downtownBGM');
            bgm.play();
            bgm.setLoop(true);

            var topModelsObject = inGame.add.image(1317, 179, 'topModelsObject');
            topModelsObject.setDepth(179);
            topModelsObject.inputEnabled = true;

            topModelsObject.setInteractive({
                pixelPerfect: true,
                useHandCursor: true,
            });

            // topModelsObject.setInteractive(inGame.input.makePixelPerfect());

            topModelsObject.on('pointerdown', () => {
                console.log('poladot');

                currentLocation = "topModels";
                socket.emit('changeRoom', "topModels");

                bg.destroy();
                bg = inGame.add.image(430, 260, 'topModelsBg');
                bg.setDepth(-500);
                bg.setInteractive();
                bg.on('pointerdown', function (pointer) { clickMovement(pointer); });

                setCameraPosition(currentLocation);
                loadLocation('topModels');
            });
            topModelsObject.on('pointerup', () => {
                disableInput = false;
            });
            locationObjects.push(topModelsObject);
        }
    }

    function loadLocation(location) {
        if (bgm)
                bgm.destroy();


        var loadingScreen = uiScene.add.image(400, 260, 'loadingScreen');
        var inLoading = uiScene.add.sprite(400, 260, 'inLoading').play('inLoad');

        for (let i = 0; i < locationObjects.length; i++) {
            locationObjects[i].destroy();
        }
        locationObjects = [];

        setTimeout(function () {
            if (location == 'downtown') {
                bgm = inGame.sound.add('downtownBGM');
                bgm.play();
                bgm.setLoop(true);
    
                var topModelsObject = inGame.add.image(1317, 179, 'topModelsObject');
                topModelsObject.setDepth(179);
                topModelsObject.inputEnabled = true;
    
                topModelsObject.setInteractive({
                    pixelPerfect: true,
                    useHandCursor: true,
                });
    
                // topModelsObject.setInteractive(inGame.input.makePixelPerfect());
    
                topModelsObject.on('pointerdown', () => {
                    console.log('poladot');
    
                    currentLocation = "topModels";
                    socket.emit('changeRoom', "topModels");
    
                    bg.destroy();
                    bg = inGame.add.image(430, 260, 'topModelsBg');
                    bg.setDepth(-500);
                    bg.setInteractive();
                    bg.on('pointerdown', function (pointer) { clickMovement(pointer); });
    
                    setCameraPosition(currentLocation);
                    loadLocation('topModels');
                });
                topModelsObject.on('pointerup', () => {
                    disableInput = false;
                });
                locationObjects.push(topModelsObject);
            }
            else if (location == 'topModels') {
                bgm = inGame.sound.add('topModelsLobbyBGM');
                bgm.play();
                bgm.setLoop(true);
    
                var sean = inGame.add.sprite(380, 260, 'topModelsSean').play('sean');
                var fan = inGame.add.sprite(230, 265, 'topModelsFan').play('fan');
                var boa2 = inGame.add.sprite(220, 370, 'topModelsBoa2').play('boa1');
                var boa1 = inGame.add.sprite(265, 365, 'topModelsBoa1').play('boa2');
                var model = inGame.add.sprite(525, 355, 'topModelsModel').play('model');
                var reporter1 = inGame.add.sprite(435, 343, 'topModelsReporter1').play('reporter1');
                var reporter2 = inGame.add.sprite(350, 383, 'topModelsReporter2').play('reporter2');
                var reporter3 = inGame.add.sprite(587, 335, 'topModelsReporter3').play('reporter3');
                var plant = inGame.add.sprite(430, 260, 'topModelsPlant');
                var rope1 = inGame.add.sprite(430, 260, 'topModelsRope1');
                var rope2 = inGame.add.sprite(430, 260, 'topModelsRope2');
                var desk = inGame.add.sprite(430, 260, 'topModelsDesk');
                var chair = inGame.add.sprite(430, 260, 'topModelsChair');
                // var door = inGame.add.sprite(380, 260, 'topModelsDoor');
                sean.setDepth(220);
                boa1.setDepth(330);
                boa2.setDepth(325);
                model.setDepth(315);
                reporter1.setDepth(303);
                reporter2.setDepth(343);
                reporter3.setDepth(295);
                plant.setDepth(220);
                rope1.setDepth(230);
                rope2.setDepth(300);
                desk.setDepth(380);
                chair.setDepth(20);
    
                locationObjects.push(sean, boa1, boa2, model, reporter1, reporter2, reporter3, fan, plant, rope1, rope2, desk, chair);
            }
            loadingScreen.destroy();
            inLoading.destroy();
        }, 1000);

        
    }

    // set camera position based on location
    function setCameraPosition(location) {
        let lc = locationConfig[location];
        
        inGame.cameras.main.setBounds(-lc.width/2 + 430, 0, lc.width - 60, 0);
        inGame.cameras.main.setScroll(lc.initialScroll, 0);
        clickOffsetX = lc.initialScroll;
        
        if (container) {
            container.body.speed = 0;
            container.setPosition(lc.playerSpawnX, lc.playerSpawnY);
        }
        
        // init left/right bounds
        leftBound = lc.initialScroll + boundOffset;
        rightBound = lc.initialScroll + 800 - boundOffset;
        camPosX = 400 + lc.initialScroll;
        camPosY = 260;
    }

    function createPlayer(playerInfo) {
        myPlayerInfo = playerInfo;

        head = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-face-' +  playerInfo.avatar['skinTone']);
        eyes = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-eyes-' +  playerInfo.avatar['eyeType']);
        lips = inGame.add.sprite(0, 0, 'lips-0');
        faceAcc = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-7-' + playerInfo.avatar['equipped'][7]);
        boardLower = inGame.add.sprite(0, 0, 'n-5-' + playerInfo.avatar['equipped'][5] + '-1');
        hairLower = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-2');
        hairUpper = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-1');
        headAcc = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-6-' + playerInfo.avatar['equipped'][6]);
        brow = inGame.add.sprite(0, 0, 'brow-0');
        player = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-body-' +  playerInfo.avatar['skinTone']);
        shoes = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-4-' + playerInfo.avatar['equipped'][4]);
        bottomItem = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-2-' + playerInfo.avatar['equipped'][2]);
        topItem = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-1-' + playerInfo.avatar['equipped'][1]);

        outfit = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-3-' + playerInfo.avatar['equipped'][3]);
        costume = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-9-' + playerInfo.avatar['equipped'][9]);
        bodyAcc = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-8-' + playerInfo.avatar['equipped'][8]);
        boardUpper = inGame.add.sprite(0, 0, 'n-5-' + playerInfo.avatar['equipped'][5] + '-2');
        usernameTag = inGame.add.sprite(0, 0, 'username-tag');

        usernameLabel = inGame.add.text(0, 100, playerInfo.username, { fontFamily: 'usernameFont', fontSize: '14px', fill: "#000000" });
        usernameLabel.originX = 0.5;
        usernameLabelCenter = usernameLabel.getCenter().x;
        usernameLabel.x = usernameLabelCenter;
        usernameLabel.setStroke('#ffffff', 2);
    
        container = inGame.add.container(playerInfo.x, playerInfo.y);
        container.setSize(300, 250);

        container.add([hairLower, head, eyes, lips, faceAcc, boardLower, hairUpper, brow, headAcc, player, shoes, bottomItem, topItem, outfit, costume, bodyAcc, boardUpper, usernameTag, usernameLabel]);
        
        for (let i =0; i < 17; i++) {
            console.log(i + ", " + JSON.stringify(container.getAt(i)));
        }

        //container.add([hairLower, head, eyes, lips, faceAcc, boardLower, hairUpper, brow, headAcc, player, shoes, bottomItem, topItem, outfit, costume, bodyAcc, boardUpper, usernameTag, usernameLabel]);
        inGame.physics.add.existing(container, false);

        container.setDepth(container.y);

        container.setDataEnabled();
        container.setData('username', playerInfo.username);
        container.setData('skinTone', playerInfo.avatar['skinTone']);
        container.setData('eyeType', playerInfo.avatar['eyeType']);
        container.setData('gender', playerInfo.avatar['gender']);
        container.setData('equipped', playerInfo.avatar['equipped']);

        var children = container.getAll();
        for (let i = 0; i < children.length - 2; i ++) {
            children[i].setInteractive({
                pixelPerfect: true,
                useHandCursor: true,
            });

            children[i].on('pointerdown', () => {
                inGame.input.stopPropagation();
                uiScene.openIDFone(true, playerInfo);
            });
        }
    }

    function addOtherPlayers(playerInfo) {
        
        const otherEyes = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-eyes-' + playerInfo.avatar['eyeType']);
        const otherLips = inGame.add.sprite(0, 0, 'lips-0');
        var otherFaceAcc = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-7-' + playerInfo.avatar['equipped'][7]);
        const otherBoardLower = inGame.add.sprite(0, 0, 'n-5-' + playerInfo.avatar['equipped'][5] + '-1');
        const otherHairLower = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-2');
        const otherHairUpper = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-0-' + playerInfo.avatar['equipped'][0] + '-1');
        const otherBrow = inGame.add.sprite(0, 0, 'brow-0');
        var otherHeadAcc = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-6-' + playerInfo.avatar['equipped'][6]);
        const otherPlayer = inGame.add.sprite(0, 0, playerInfo.avatar['gender']  + '-body-' + playerInfo.avatar['skinTone']);
        const otherShoes = inGame.add.sprite(0, 0, playerInfo.avatar['gender']  + '-4-' + playerInfo.avatar['equipped'][4]);
        var otherBottomItem, otherTopItem;
        otherBottomItem = inGame.add.sprite(0, 0, playerInfo.avatar['gender']  + '-2-' + playerInfo.avatar['equipped'][2]);
        otherTopItem = inGame.add.sprite(0, 0, playerInfo.avatar['gender']  + '-1-' + playerInfo.avatar['equipped'][1]);

        var otherOutfit = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-3-' + playerInfo.avatar['equipped'][3]);
        var otherCostume = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-9-' + playerInfo.avatar['equipped'][9]);
        var otherBodyAcc = inGame.add.sprite(0, 0, playerInfo.avatar['gender'] + '-8-' + playerInfo.avatar['equipped'][8]);
        const otherBoardUpper = inGame.add.sprite(0, 0, 'n-5-' + playerInfo.avatar['equipped'][5] + '-2');
        var otherUsernameTag = inGame.add.sprite(0, 0, 'username-tag');
        var otherUsernameLabel = inGame.add.text(0, 0 + 100, playerInfo.username, { fontFamily: 'usernameFont', fontSize: '15px', fill: "#000000" });
        const otherHead = inGame.add.sprite(0, 0, playerInfo.avatar['gender']  + '-face-' + playerInfo.avatar['skinTone']);
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
        otherBottomItem.flipX = playerInfo.flipX;
        otherTopItem.flipX = playerInfo.flipX;
        otherShoes.flipX = playerInfo.flipX;
        otherBoardLower.flipX = playerInfo.flipX;
        otherBoardUpper.flipX = playerInfo.flipX;

        otherUsernameTag.flipX = playerInfo.flipX;

        var orderItems = [otherHead, otherEyes, otherLips, otherFaceAcc, otherBoardLower, otherHairLower, otherHairUpper, otherBrow, otherHeadAcc, otherPlayer, otherShoes, otherBottomItem, otherTopItem, otherOutfit, otherBodyAcc, otherBoardUpper, otherUsernameTag, otherUsernameLabel];

        const otherContainer = inGame.add.container(playerInfo.x, playerInfo.y);

        otherContainer.add([otherHairLower, otherHead, otherEyes, otherLips, otherFaceAcc, otherBoardLower, otherHairUpper, otherBrow, otherHeadAcc, otherPlayer, otherShoes, otherBottomItem, otherTopItem, otherOutfit, otherCostume, otherBodyAcc, otherBoardUpper, otherUsernameTag, otherUsernameLabel]);

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

        var children = otherContainer.getAll();
        for (let i = 0; i < children.length - 2; i ++) {
            children[i].setInteractive({
                pixelPerfect: true,
                useHandCursor: true,
            });

            children[i].on('pointerdown', () => {
                uiScene.openIDFone(false, playerInfo);
            });
        }
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

                p.removeAll(true);
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
        console.log(JSON.stringify(changed));
        if (pid == myPlayerInfo.id) {
            for (let i = 0; i < Object.keys(changed).length; i++) {
                if (changed[i].length > 0) {
                    if (changed[i][0] == -1)
                        changeClothes(container, i, changed[i][0], true);
                    else
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
                        if (changed[i][0] == -1)
                            changeClothes(p, i, changed[i][0], false);
                        else
                            changeClothes(p, i, changed[i][0].id, false);
                    }
                }
            }
        }.bind(this));
    }.bind(this));

    function changeClothes(cont, typeId, itemId, isLocalPlayer) {
        var updateItemEquipped = cont.getData('equipped');
        var prefix = "n"

        if (typeId != 5)
            prefix = myPlayerInfo.avatar['gender'];

        console.log("equipping " + typeId);


        if (typeId == 0 && isLocalPlayer) {
            equippedItem = inGame.add.sprite(0, 0, prefix + '-'+ typeId.toString()+ '-' + itemId.toString() + '-1');
            var equippedItem2 = inGame.add.sprite(0, 0, prefix + '-'+ typeId.toString()+ '-' + itemId.toString() + '-2');
            cont.replace(cont.getAt(iMap[typeId][0]), equippedItem, true);
            cont.replace(cont.getAt(iMap[typeId][1]), equippedItem2, true);
            equippedItem.flipX = player.flipX;
            equippedItem2.flipX = player.flipX;
        }
        else if (typeId == 0 || typeId == 5) {
            equippedItem = inGame.add.sprite(0, 0, prefix + '-'+ typeId.toString()+ '-' + itemId.toString() + '-1');
            var equippedItem2 = inGame.add.sprite(0, 0, prefix + '-'+ typeId.toString()+ '-' + itemId.toString() + '-2');
            cont.replace(cont.getAt(iMap[typeId][0]), equippedItem, true);
            cont.replace(cont.getAt(iMap[typeId][1]), equippedItem2, true);
            
            equippedItem.x = cont.getAt(0).x;
            equippedItem.y = cont.getAt(0).y;
            equippedItem2.x = cont.getAt(0).x;
            equippedItem2.y = cont.getAt(0).y;
            equippedItem.flipX = cont.flipX;
            equippedItem2.flipX = cont.flipX;
        }
        else if (isLocalPlayer) {
            // var deleteItem = cont.getAt(iMap[typeId]);
            equippedItem = inGame.add.sprite(0, 0, prefix + '-'+ typeId+ '-' + itemId);
            cont.replace(cont.getAt(iMap[typeId]), equippedItem, true);
            
            equippedItem.flipX = player.flipX;
        }
        else {
            console.log("HERERERERER: " + prefix + '-'+ typeId+ '-' + itemId);
            equippedItem = inGame.add.sprite(0, 0, prefix + '-'+ typeId+ '-' + itemId);
            cont.replace(cont.getAt(iMap[typeId]), equippedItem, true);

            equippedItem.flipX = player.flipX;
            equippedItem.x = cont.getAt(0).x;
            equippedItem.y = cont.getAt(0).y;
            equippedItem.flipX = cont.flipX;
        }

        updateItemEquipped[typeId] = itemId;
        
        cont.setData('equipped', updateItemEquipped);
    }

    globalThis.socket.on('playerWaveResponse', function (playerInfo) {
        otherPlayers.getChildren().forEach(function (p) {
            if (playerInfo.id === p.id) { // && !p.x[7].anims.isPlaying && !p.x[1].anims.isPlaying
                p.getAt(cMap.player).play(JSON.parse(JSON.stringify(p.getAt(cMap.player))).textureKey + '-wave');
                p.getAt(cMap.lips).play(JSON.parse(JSON.stringify(p.getAt(cMap.lips))).textureKey + '-wave');
                p.getAt(cMap.top).play(JSON.parse(JSON.stringify(p.getAt(cMap.top))).textureKey + '-wave');
                }
            }.bind(this));
    }.bind(this));

    globalThis.socket.on('playerCryResponse', function (playerInfo) {
        otherPlayers.getChildren().forEach(function (p) {
            if (playerInfo.id === p.id) {
                    for (let i = 0; i < 10; i++) {
                        p.getAt(i).play(JSON.parse(JSON.stringify(p.getAt(i))).textureKey + '-cry');
                    }
                    p.getAt(cMap.top).play(JSON.parse(JSON.stringify(p.getAt(cMap.top))).textureKey + '-cry');
                    p.getAt(cMap.bottom).play(JSON.parse(JSON.stringify(p.getAt(cMap.bottom))).textureKey + '-cry');
                    p.getAt(cMap.outfit).play(JSON.parse(JSON.stringify(p.getAt(cMap.outfit))).textureKey + '-cry');
                }
            }.bind(this));
    }.bind(this));

    globalThis.socket.on('playerJumpResponse', function (playerInfo) {
        otherPlayers.getChildren().forEach(function (p) {
            if (playerInfo.id === p.id) {
                    for (let i = 0; i < cMap.boardUpper; i++) {
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
            if (playerInfo.id === p.id) {
                p.getAt(cMap.eyes).play(JSON.parse(JSON.stringify(p.getAt(cMap.eyes))).textureKey + '-wink');
            }
            }.bind(this));
    }.bind(this));

    globalThis.socket.on('chatMessageResponse', function (playerInfo, msg) {
        otherPlayers.getChildren().forEach(function (p) {
            if (playerInfo.id === p.id && !p.getAt(cMap.player).anims.isPlaying && !p.getAt(cMap.eyes).anims.isPlaying) {

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

    //#region Action Animations
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
    
    //#region Top Models Animations
    this.anims.create({
        key: 'sean',
        frames: this.anims.generateFrameNumbers('topModelsSean'),
        frameRate: 4,
        repeat: -1
    });


    this.anims.create({
        key: 'fan',
        frames: this.anims.generateFrameNumbers('topModelsFan'),
        frameRate: 4,
        repeat: -1
    });

    this.anims.create({
        key: 'boa1',
        frames: [
          { key: 'topModelsBoa1', frame: 0, duration: 2500 }, // first frame with duration of 1000ms (1 second)
          { key: 'topModelsBoa1', frame: 1, duration: 50 } // second frame with duration of 50ms
        ],
        frameRate: 4,
        repeat: -1
      });

      this.anims.create({
        key: 'boa2',
        frames: [
          { key: 'topModelsBoa2', frame: 0, duration: 4000 }, // first frame with duration of 1000ms (1 second)
          { key: 'topModelsBoa2', frame: 1, duration: 50 } // second frame with duration of 50ms
        ],
        frameRate: 4,
        repeat: -1
      });

      this.anims.create({
        key: 'model',
        frames: [
          { key: 'topModelsModel', frame: 0, duration: 4500 }, // first frame with duration of 1000ms (1 second)
          { key: 'topModelsModel', frame: 1, duration: 50 } // second frame with duration of 50ms
        ],
        frameRate: 4,
        repeat: -1
      });

      this.anims.create({
        key: 'reporter1',
        frames: [
          { key: 'topModelsReporter1', frame: 0, duration: 1200 },
          { key: 'topModelsReporter1', frame: 1, duration: 50 },
          { key: 'topModelsReporter1', frame: 0, duration: 50 },
          { key: 'topModelsReporter1', frame: 2, duration: 300 },
          { key: 'topModelsReporter1', frame: 3, duration: 50 },
          { key: 'topModelsReporter1', frame: 2, duration: 300 },
        ],
        frameRate: 4,
        repeat: -1
      });

      this.anims.create({
        key: 'reporter2',
        frames: [
          { key: 'topModelsReporter2', frame: 0, duration: 1300 },
          { key: 'topModelsReporter2', frame: 1, duration: 50 },
          { key: 'topModelsReporter2', frame: 0, duration: 50 },
          { key: 'topModelsReporter2', frame: 2, duration: 300 },
          { key: 'topModelsReporter2', frame: 3, duration: 50 },
          { key: 'topModelsReporter2', frame: 2, duration: 300 },
        ],
        frameRate: 4,
        repeat: -1
      });

      this.anims.create({
        key: 'reporter3',
        frames: [
          { key: 'topModelsReporter3', frame: 0, duration: 1400 },
          { key: 'topModelsReporter3', frame: 1, duration: 50 },
          { key: 'topModelsReporter3', frame: 0, duration: 50 },
          { key: 'topModelsReporter3', frame: 2, duration: 300 },
          { key: 'topModelsReporter3', frame: 3, duration: 50 },
          { key: 'topModelsReporter3', frame: 2, duration: 300 },
        ],
        frameRate: 4,
        repeat: -1
      });
    //#endregion

    function clickMovement(pointer) {
        console.log("Clicked on bg");
        
        if (disableInput) return;
        
        isTyping = false;
        globalInputChat.value = defaultChatBarMessage;
        globalInputChat.blur();
        
        globalPointer.x = pointer.x + clickOffsetX;
        globalPointer.y = pointer.y;
        inGame.physics.moveTo(container, globalPointer.x, globalPointer.y - clickOffsetY, 150);
    }
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
    // if (container)
    //     console.log("Position x: " + container.x + ", y: " + container.y);

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

    let panDistance = 300;

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

            } else if (keyRight.isDown) {
                container.body.setVelocity(0);
                moveX(container.x, container.y, 1);
                console.log(camPosX);
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

                container.getAt(cMap.player).flipX = false;
                container.getAt(cMap.head).flipX = false;
                container.getAt(cMap.brow).flipX = false;
                container.getAt(cMap.eyes).flipX = false;
                container.getAt(cMap.lips).flipX = false;
                container.getAt(cMap.faceAcc).flipX = false;
                container.getAt(cMap.boardLower).flipX = false;
                container.getAt(cMap.boardUpper).flipX = false;
                container.getAt(cMap.hairLower).flipX = false;
                container.getAt(cMap.hairUpper).flipX = false;
                container.getAt(cMap.headAcc).flipX = false;
                container.getAt(cMap.top).flipX = false;
                container.getAt(cMap.bottom).flipX = false;
                container.getAt(cMap.outfit).flipX = false;
                container.getAt(cMap.shoes).flipX= false;
                container.getAt(cMap.bodyAcc).flipX = false;

            } else if (keyRight.isDown || container.body.velocity.x > 0) {
                container.getAt(cMap.player).flipX = true;
                container.getAt(cMap.head).flipX = true;
                container.getAt(cMap.brow).flipX = true;
                container.getAt(cMap.eyes).flipX = true;
                container.getAt(cMap.lips).flipX = true;
                container.getAt(cMap.faceAcc).flipX = true;
                container.getAt(cMap.boardLower).flipX = true;
                container.getAt(cMap.boardUpper).flipX = true;
                container.getAt(cMap.hairLower).flipX = true;
                container.getAt(cMap.hairUpper).flipX = true;
                container.getAt(cMap.headAcc).flipX = true;
                container.getAt(cMap.top).flipX = true;
                container.getAt(cMap.bottom).flipX = true;
                container.getAt(cMap.outfit).flipX = true;
                container.getAt(cMap.shoes).flipX= true;
                container.getAt(cMap.bodyAcc).flipX = true;
            }
            //#endregion

            // Actions
        if (key1.isDown) {

            console.log(container.x, container.y);

            if (!container.getAt(cMap.player).anims.isPlaying && !container.getAt(cMap.eyes).anims.isPlaying) {
                globalThis.socket.emit('playerWave');
                container.getAt(cMap.player).play(myPlayerInfo.avatar.gender + '-body-' + container.getData('skinTone') + '-wave');

                if (container.getData('equipped')[3] === -1)
                    container.getAt(cMap.top).play(myPlayerInfo.avatar['gender']  + '-1-' + container.getData('equipped')[1] + '-wave');
                else
                    container.getAt(cMap.outfit).play(myPlayerInfo.avatar['gender']  + '-3-' + container.getData('equipped')[3] + '-wave');
                    
                container.getAt(cMap.lips).play('lips-0-wave');
            }
        }

        if (key2.isDown) {
            if (!container.getAt(cMap.player).anims.isPlaying && !container.getAt(cMap.eyes).anims.isPlaying) {
                globalThis.socket.emit('playerCry');
                container.getAt(cMap.player).play(myPlayerInfo.avatar['gender'] + '-body-' + container.getData('skinTone') + '-cry');
                container.getAt(cMap.head).play(myPlayerInfo.avatar['gender']  + '-face-' + container.getData('skinTone') + '-cry');
                container.getAt(cMap.eyes).play(myPlayerInfo.avatar['gender'] + '-eyes-' + container.getData('eyeType') + '-cry');
                container.getAt(cMap.hairLower).play(myPlayerInfo.avatar['gender']  + '-0-' + container.getData('equipped')[0] + '-2-cry');
                container.getAt(cMap.hairUpper).play(myPlayerInfo.avatar['gender']  + '-0-' + container.getData('equipped')[0] + '-1-cry');
                container.getAt(cMap.brow).play('brow-0-cry');

                if (container.getData('equipped')[3] === -1)
                    container.getAt(cMap.top).play(myPlayerInfo.avatar['gender']  + '-1-' + container.getData('equipped')[1] + '-cry');
                else
                    container.getAt(cMap.outfit).play(myPlayerInfo.avatar['gender']  + '-3-' + container.getData('equipped')[3] + '-cry');
            }
        }

        if (key3.isDown) {
            if (!container.getAt(cMap.player).anims.isPlaying && !container.getAt(cMap.eyes).anims.isPlaying) {
                globalThis.socket.emit('playerJump');
                container.getAt(cMap.player).play(myPlayerInfo.avatar.gender + '-body-' + container.getData('skinTone') + '-jump');
                container.getAt(cMap.head).play(myPlayerInfo.avatar['gender']  + '-face-' + container.getData('skinTone') + '-jump');
                container.getAt(cMap.eyes).play(myPlayerInfo.avatar['gender'] + '-eyes-' + container.getData('eyeType') + '-jump');
                container.getAt(cMap.lips).play('lips-0-jump');
                container.getAt(cMap.hairLower).play(myPlayerInfo.avatar['gender']  + '-0-' + container.getData('equipped')[0] + '-2-jump');
                container.getAt(cMap.hairUpper).play(myPlayerInfo.avatar['gender']  + '-0-' + container.getData('equipped')[0] + '-1-jump');
                container.getAt(cMap.brow).play('brow-0-jump');

                if (container.getData('equipped')[3] === -1)
                    container.getAt(cMap.top).play(myPlayerInfo.avatar['gender']  + '-1-' + container.getData('equipped')[1] + '-jump');
                else
                    container.getAt(cMap.outfit).play(myPlayerInfo.avatar['gender']  + '-3-' + container.getData('equipped')[3] + '-jump');
                
                container.getAt(cMap.bottom).play(myPlayerInfo.avatar['gender']  + '-2-' + container.getData('equipped')[2] + '-jump');
                container.getAt(cMap.shoes).play(myPlayerInfo.avatar['gender']  + '-4-' + container.getData('equipped')[4] + '-jump');
            }
        }

        if (key4.isDown) {
            if (!container.getAt(cMap.player).anims.isPlaying && !container.getAt(cMap.eyes).anims.isPlaying) {
                globalThis.socket.emit('playerWink');
                container.getAt(cMap.eyes).play(myPlayerInfo.avatar['gender'] + '-eyes-' + container.getData('eyeType') + '-wink');
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
        var flipX = container.getAt(cMap.player).flipX;
        
        if (container.oldPosition && (x !== container.oldPosition.x || y !== container.oldPosition.y || flipX !== container.oldPosition.flipX && !stopMoving)) {
            globalThis.socket.emit('playerMovement', { x, y, flipX });
        }

        // save old position data
        container.oldPosition = {
            x: container.x,
            y: container.y,
            flipX: container.getAt(cMap.player).flipX
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
    scene: [login, loading, inGame, uiScene]
};

var game = new Phaser.Game(config);