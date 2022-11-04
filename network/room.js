module.exports.Room =  class Room {
    constructor(username, room, flipX, x, y) {
      this.username = username,
      this.room = room;
      this.flipX = flipX;
      this.x = x;
      this.y = y;
    }
    setId(newId) {
        this.id = newId;
    }
  }