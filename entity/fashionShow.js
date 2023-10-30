module.exports.FashionShow =  class FashionShow {
    constructor(hostUser, hostGender) {
        this.hostUser = hostUser, // username
        this.hostGender = hostGender,
        this.started = false,
        this.playerCount = 5,
        this.players = []
    }
    start() {
        this.started = true;
    }
    addPlayer(username) {
        this.players.push(username);
        this.playerCount++;
    }
    
  }