const mongoose = require('mongoose');

// main().catch(err => console.log(err));

// async function main() {
//     await mongoose.connect('mongodb+srv://root:jcohnKil2BDsyVMr@fr-cluster.qaeqyz4.mongodb.net/?retryWrites=true&w=majority');
// }

const userSchema = new mongoose.Schema({
    // id: Number,
    username: String,
    password: String,
    gender: String,
    stars: Number,
    ecoins: Number,
    level: Number,
});

exports.User = mongoose.model('User', userSchema);




// const firstPlayer = new Player({ id: 0, username: 'crystal', password: '123456'});
// firstPlayer.save();