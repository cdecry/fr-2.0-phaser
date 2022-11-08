const { User, Avatar, Item} = require("./schemas");

//#region userResolver

exports.registerUser =  async function (id, username, password, gender) {
    const newPlayer = new User({
        id: id,
        username: username,
        password: password,
        gender: gender,
        stars: 0,
        ecoins: 0,
        level: 0,
        inventory: []
    });
    await newPlayer.save();
    console.log('new user registered');
}

exports.loginRequest = async function (username, password) {
    return new Promise((resolve, reject) => {
        User.findOne({ 'username': username }, 'id username password', function (err, user) {
            if (user != null && password === user.password)
                resolve(user.id);
            else
                resolve(null);
        });
    });
}

exports.getNumberOfUsers = async function () {
    return new Promise((resolve, reject) => {
        User.countDocuments({}, function (err, count) {
            resolve(count);                
        });
    });
}

exports.getUser = async function (id) {
    return new Promise((resolve, reject) => {
        User.findOne({ 'id': id }, 'username gender stars ecoins level', function (err, user) {
            var userObj = new Object();
            userObj['id'] = id;
            userObj['username'] = user.username;
            userObj['password'] = user.password;
            userObj['gender'] = user.gender;
            userObj['stars'] = user.stars;
            userObj['ecoins'] = user.ecoins;
            userObj['level'] = user.level;
            resolve(userObj);
        });
    });
}

exports.updateInventory = async function (id, inventory) {
    return new Promise((resolve, reject) => {
        User.updateOne({ 'id': id }, { $set: { 'inventory': inventory } }, function (err, count) {
            resolve();                
        });
    });
    console.log('updateInventory: User inventory updated');
}
//#endregion

//#region avatarResolver

exports.addAvatar =  async function (id, userId, gender, eyeType, skinTone, equipped) {
    const newAvatar = new Avatar({
        id: id,
        userId: userId,
        gender: gender,
        eyeType: eyeType,
        skinTone: skinTone,
        equipped: equipped,
    });
    await newAvatar.save();
    console.log('new avatar created');
}

exports.getUserAvatar = async function (userId) {
    return new Promise((resolve, reject) => {
        Avatar.findOne({ 'userId': userId }, 'gender eyeType skinTone equipped', function (err, avatar) {
            var avatarObj = new Object();
            avatarObj['userId'] = userId;
            avatarObj['gender'] = avatar.gender;
            avatarObj['eyeType'] = avatar.eyeType;
            avatarObj['skinTone'] = avatar.skinTone;
            avatarObj['equipped'] = avatar.equipped;
            resolve(avatarObj);
        });
    });
}

exports.changeEyeType =  async function (userId, eyeType) {
    return new Promise((resolve, reject) => {
        Avatar.updateOne({ 'userId': userId }, { $set: { 'eyeType': eyeType } }, function (err, count) {
            console.log('changeEyeType: Avatar eye type updated');
            resolve();                
        });
    });
}

exports.changeSkinTone =  async function (userId, skinTone) {
    return new Promise((resolve, reject) => {
        Avatar.updateOne({ 'userId': userId }, { $set: { 'skinTone': skinTone } }, function (err, count) {
            console.log('changeSkinTone: Avatar skin tone updated');
            resolve();                
        });
    });
}

exports.changeEquipped = async function (userId, equipped) {
    return new Promise((resolve, reject) => {
        Avatar.updateOne({ 'userId': userId }, { $set: { 'equipped': equipped } }, function (err, count) {
            console.log('changeEquipped: Avatar equipped updated');
            resolve();                
        });
    });
}

//#endregion

//#region itemResolver

// for development
exports.addItem =  async function (id, type, gender, name, description, price, ecoinPrice, requiredLevel, rarity, rarePoints) {
    const newItem = new Item({
        id: id,
        type: type,
        gender: gender,
        name: name,
        description: description,
        price: price,
        ecoinPrice: ecoinPrice,
        requiredLevel: requiredLevel,
        rarity: rarity,
        rarePoints, rarePoints,
    });
    await newItem.save();
    console.log('addItem: new item added');
}

//#endregion
