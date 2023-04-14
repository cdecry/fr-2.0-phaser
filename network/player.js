module.exports.Player =  class Player {
    constructor(id, username, room, avatar, flipX, x, y, inventory) {
        this.id = id,
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