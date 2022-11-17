const mongoose = require('mongoose');

const { userExists, registerUser, getNumberOfUsers, getUser, addAvatar, addItem, updateInventory, changeEquipped, getUserAvatar, changeEyeType } = require("./queries");

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb+srv://root:jcohnKil2BDsyVMr@fr-cluster.qaeqyz4.mongodb.net/?retryWrites=true&w=majority');
    await changeEyeType(2, 1);
    // await changeEquipped(2, [0, 5, 13, -1, 2, 0, -1, -1, -1]);
    // await registerUser(1, 'test_1', '123', 'f');
    // await registerUser(2, 'test_2', '123', 'f');
    // await addAvatar(1, 1, 'f', 0, 1, [0, 1, 2, 3, 4]);
    // await addAvatar(2, 2, 'f', 3, 2, [0, 1, 2, 3, 4]);

    // ADD AVATAR
    // await addAvatar(0, 0, 'f', 1, 0, [0, 1, 2, 3, 4]);

    // UPDATE INVENTORY
    // await updateInventory(0, [0, 1, 2, 3, 4]);

    // ADD ITEM
    // await addItem(0, 0, 'f', 'Blonde Pigtails', 'These blonde pigtails are so cute!', 200, 200, 0, 0, 0);
    // await addItem(1, 1, 'f', 'Yellow Strapped Tank', 'A bright yellow tank top!', 200, 200, 0, 0, 0);
    // await addItem(2, 2, 'f', 'Blue Shorts', 'Not-too-short blue shorts with a hint of yellow.', 100, 100, 0, 0, 0);
    // await addItem(3, 4, 'f', 'Black Sandals', 'You\'ll never lose these in the sand!', 150, 150, 0, 0, 0);
    // await addItem(4, 5, 'f', 'Rainbow Board', 'Fun fact: This board was designed by strawberrystar.', 300, 300, 0, 0, 0);
    // await addAvatar(0, 0, 'f', 1, 0, [0, 0, 0, 0, 0]);

    // REGISTER USER
    // var newId = await getNumberOfUsers();
    // await registerUser(newId, 'crystal', '123', 'f');

    // GET USER
    // var user = await getUser(0);
    // console.log(JSON.stringify(user));
}

// id: Number,             // itemId
// type: Number,           /*  0 - Hair
//                             1 - Top
//                             2 - Bottom
//                             3 - Outfit
//                             4 - Shoes
//                             5 - Board
//                             6 - Head Acc.
//                             7 - Face Acc.
//                             8 - Body Acc.
//                         */
// gender: String
// name: String,
// description: String,
// price: Number,          // price of item in stars
// ecoinPrice: Number,     // price of item in ecoins
// requiredLevel: Number,
// rarity: Number,         /*  0 - Normal
//                             1 - Rare
//                             ...
//                         */
// rarePoints: Number,
