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
    inventory: [Number],    // list of numeriocal ids corres. to itemIds
});

const avatarSchema = new mongoose.Schema({
    id: Number,         // avatarId
    userId: Number,     // id for corres. user
    gender: String,
    eyeType: Number,    // 0-14
    skinTone: Number,   // 0-5
    equipped: [Number],  // list of numerical ids corres. to itemIds
});

const itemSchema = new mongoose.Schema({
    id: Number,             // itemId
    type: Number,           /*  0 - Hair
                                1 - Top
                                2 - Bottom
                                3 - Outfit
                                4 - Shoes
                                5 - Board
                                6 - Head Acc.
                                7 - Face Acc.
                                8 - Body Acc.
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
});

exports.User = mongoose.model('User', userSchema);
exports.Avatar = mongoose.model('Avatar', avatarSchema);
exports.Item = mongoose.model('Item', itemSchema);

// const firstPlayer = new Player({ id: 0, username: 'crystal', password: '123456'});
// firstPlayer.save();