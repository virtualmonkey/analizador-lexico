export default class Tree {
  constructor(uid, head, left, right) {
    this.uid = uid || null;
    this.head = head || null;
    this.left = left || null;
    this.right = right || null;
  }

  getUniqueTree() {
    return this.head + "<--->" + this.uid;
  }
}
