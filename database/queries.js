const { User } = require("./schemas");

// exports.loginRequest = async function (username, password) {

//     User.findOne({ 'username': username }, 'username password', function (err, user) {
//         if (err) return handleError(err);
//         else if (user != null && password === user.password) {
//             console.log('queries: correct info!');
//             return true;
//         }
//         console.log('queries: incorect info.');
//         return false;
//     });
// }

exports.loginRequest = async function (username, password) {
    return new Promise((resolve, reject) => {
        User.findOne({ 'username': username }, 'username password', function (err, user) {
            resolve(user != null && password === user.password);                
        });
    });
}

exports.registerUser =  async function (username, password, gender) {
    const newPlayer = new User({
        username: username,
        password: password,
        gender: gender,
        stars: 0,
        ecoins: 0,
        level: 0,
    });
    await newPlayer.save();
    console.log('new user registered');
}