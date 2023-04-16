module.exports.Player =  class Player {
    constructor(id, pid, username, room, avatar, flipX, x, y, inventory) {
        this.id = id,// socket id
        this.pid = pid,// player id
        this.username = username,
        this.room = room;
        this.avatar = avatar;
        this.flipX = flipX;
        this.x = x;
        this.y = y;
        this.inventory = inventory;
    }
    setId(newId) {
        this.id = newId;
    }
  }