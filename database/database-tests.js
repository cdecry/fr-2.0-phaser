require('dotenv').config();
const mongoose = require('mongoose');

const { userExists, registerUser, getNumberOfUsers, getUser, addAvatar, addItem, updateInventory, changeEquipped, getUserAvatar, changeEyeType, addToInventory, getItem } = require("./queries");
const { userMigration} = require("./migrations");

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(process.env.DB_URI);
    // await userMigration();
    // for (let i = 0; i < 9; i++) {
    //     await addToInventory(0, 2, i, false);
    // }
    // await addToInventory(0, 2, 13, false);
    // await addToInventory(0, 3, 10, false);
    // await addToInventory(0, 1, 15, false);
    // await addToInventory(0, 4, 2, false);
    // await addToInventory(0, 5, 0, false);
    //await changeEquipped(0, [0, 15, 13, -1, 2, 0, -1, -1, -1, -1]);
    // REGISTER USER
    // var newId = await getNumberOfUsers();
    // await registerUser(newId, 'girl0416', '123', 'f');
    // await addAvatar(newId, newId, 'f', 1, 1, [8, 6, 2, -1, 2, 0, -1, -1, -1, -1]);
    //await changeEquipped(2, [-1, -1, -1, -1, -1, 3, -1, -1, -1]);

    

    // await addToInventory(2, 5, 3, false);
    // await addToInventory(2, 5, 4, true);
    // await addToInventory(newId, 1, 7, false);
    // await addToInventory(newId, 2, 2, false);
    // await addToInventory(newId, 4, 4, false);
    // await addToInventory(newId, 5, 3, false);

    // await addItem(0, 0, 0, 'f', 'Sidebang w/Ribbon', 'Ribbons can make anyone look pretty!', 100, 100, 0, 0, 0, false);
    // await changeEquipped(0, [0, -1, -1, 10, 2, 0, -1, -1, -1]);
    // await registerUser(1, 'test_1', '123', 'f');
    // await registerUser(2, 'test_2', '123', 'f');
    // await addAvatar(1, 1, 'f', 0, 1, [0, 1, 2, 3, 4]);
    // await addAvatar(2, 2, 'f', 3, 2, [0, 1, 2, 3, 4]);

    // ADD AVATAR
    // await addAvatar(0, 0, 'f', 1, 0, [0, 1, 2, 3, 4]);

    // UPDATE INVENTORY
    // await updateInventory(0, [0, 1, 2, 3, 4]);

    // ADD ITEM
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
