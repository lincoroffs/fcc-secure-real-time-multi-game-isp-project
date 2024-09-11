class Player {
  constructor({x, y, score = 0, id}) {
    this.id = id;
    this.score = score;
    this.x = x;
    this.y = y;
  }

  movePlayer(dir, speed) {
    switch (dir) {
      case 'up':
        this.y -= speed;
        break;
      case 'down':
        this.y += speed;
        break;
      case 'left':
        this.x -= speed;
        break;
      case 'right':
        this.x += speed;
        break;
      default:
        break;
    }
  }

  collision(item) {
    return this.x === item.x && this.y === item.y;
  }

  calculateRank(arr) {
    arr.sort((a, b) => b.score - a.score);
    const rank = arr.findIndex(p => p.id === this.id) + 1;
    return `Rank: ${rank}/${arr.length}`
  }
}

export default Player;
