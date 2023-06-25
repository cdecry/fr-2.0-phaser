module.exports.Player =  class Player {
    constructor(id, pid, username, room, avatar, flipX, x, y, inventory, level, isMember, idfone, stars, ecoins,
         buddies) {
        this.id = id,// socket id
        this.pid = pid,// player id
        this.username = username,
        this.room = room;
        this.avatar = avatar;
        this.flipX = flipX;
        this.x = x;
        this.y = y;
        this.inventory = inventory;
        this.level = level;
        this.isMember = isMember;
        this.idfone = idfone;
        this.stars = stars;
        this.ecoins = ecoins;
        this.buddies = buddies;
    }
    setId(newId) {
        this.id = newId;
    }
  }