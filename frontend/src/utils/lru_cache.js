export class LRUCache {
  constructor(limit = 100) {
    this.limit = limit;
    this.cache = new Map(); // maintains insertion order
  }

  get(key) {
    if (!this.cache.has(key)) return null;

    // Refresh usage
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key); // refresh
    } else if (this.cache.size >= this.limit) {
      // Delete least recently used (first item)
      const lruKey = this.cache.keys().next().value;
      this.cache.delete(lruKey);
    }

    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  getAll() {
    return Array.from(this.cache.values());
  }
}
