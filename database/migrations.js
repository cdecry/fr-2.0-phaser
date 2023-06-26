const { User, Avatar, Item} = require("./schemas");

// {
//     title: "fantage rookie",
//     skin: 0,
//     stickerPages: [ {
//         stickerId: 12,
//         x: 100,
//         y: 60,
//         flipX: false,
//         givenBy: "bobbyBob123",
//         date: "04/28/2023"
//     },
//     medals: [ {
//         medalId: 3, // name and title retrieved by medalId (client side)
//         level: 15,
//         points: 236,
//         nextLevel: 240,
//     }]
// }

exports.userMigration = async function () {
    try {
      // Find and update documents
      const documents = await User.find();
      for (const doc of documents) {
        // Add the new fields to each document
        doc.buddies = [
            { id: 2, username: "jake" }
        ];
        doc.idfone = {
          title: 'fantage novice',
          skin: 0,
          stickerPages: [[], [], [], [], [], [], [], [], [], []],
          medals: []
        };
  
        // Save the updated document
        await doc.save();
      }
      console.log('Documents updated successfully.');
    } catch (error) {
      console.error('Error updating documents:', error);
    }
  }