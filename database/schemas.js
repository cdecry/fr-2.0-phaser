const mongoose = require('mongoose');

// main().catch(err => console.log(err));

// async function main() {
//     await mongoose.connect('mongodb+srv://root:jcohnKil2BDsyVMr@fr-cluster.qaeqyz4.mongodb.net/?retryWrites=true&w=majority');
// }

const userSchema = new mongoose.Schema({
    id: Number,             // 0-500
    username: String,
    password: String,
    gender: String,
    stars: Number,
    ecoins: Number,
    level: Number,
    isMember: Boolean,
    inventory: Object,    // list of inventoryItems
    // new
    buddies: Object,      // list of buddy names
    idfone: Object,
});

// idfone Object:
/*
{
    skin: 0,
    stickerPages: [ {
        stickerId: 12,
        x: 100,
        y: 60,
        flipX: false,
        givenBy: "bobbyBob123",
        date: "04/28/2023"
    }
    medals: [ {
        medalId: 3, // name and title retrieved by medalId (client side)
        level: 15,
        points: 236,
        nextLevel: 240,
    }]
}
*/


const avatarSchema = new mongoose.Schema({
    id: Number,         // avatarId
    userId: Number,     // id for corres. user
    gender: String,
    eyeType: Number,    // 0-14
    skinTone: Number,   // 0-5
    equipped: [Number],  // list of numerical ids corres. to itemIds
});

const itemSchema = new mongoose.Schema({
    itemId: Number,             // itemid
    id: Number,             // itemtype id
    type: Number,           /*  0 - Hair
                                1 - Top
                                2 - Bottom
                                3 - Outfit
                                4 - Shoes
                                5 - Board
                                6 - Head Acc.
                                7 - Face Acc.
                                8 - Body Acc.
                                9 - Costumes
                            */
    gender: String,
    name: String,
    description: String,
    price: Number,          // price of item in stars
    ecoinPrice: Number,     // price of item in ecoins
    requiredLevel: Number,
    rarity: Number,         /*  0 - Normal
                                1 - Rare
                                ...
                            */
    rarePoints: Number,
    membership: Boolean,
});

exports.User = mongoose.model('User', userSchema);
exports.Avatar = mongoose.model('Avatar', avatarSchema);
exports.Item = mongoose.model('Item', itemSchema);

// const firstPlayer = new Player({ id: 0, username: 'crystal', password: '123456'});
// firstPlayer.save();