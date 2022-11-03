const mongoose = require('mongoose');

const { userExists, registerUser } = require("./queries");

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb+srv://root:jcohnKil2BDsyVMr@fr-cluster.qaeqyz4.mongodb.net/?retryWrites=true&w=majority');
}

// const playerSchema = new mongoose.Schema({
//     id: Number,
//     username: String,
//     password: String,
// });

// const Player = mongoose.model('Player', playerSchema);

// const firstPlayer = new Player({ id: 0, username: 'crystal', password: '123456'});
// firstPlayer.save();

registerUser('crystalightpeace', '123456', 'f');
console.log('done');