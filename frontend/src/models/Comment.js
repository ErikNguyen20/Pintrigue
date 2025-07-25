import { User } from './User';

export class Comment {
  constructor(data) {
    this.id = data.comment_id;
    this.user = new User(data.user || {});
    this.created_at = data.created_at ? new Date(data.created_at) : null;
    this.content = data.content || "";
    this.likes_count = data.likes_count || 0;
    this.is_liked = data.is_liked || false;
  }

  get displayName() {
    return this.user.username;
  }

  toString() {
    return `Comment {
      id: ${this.id},
      user: ${this.user.toString()},
      created_at: ${this.created_at},
      content: "${this.content}",
      likes_count: ${this.likes_count},
      is_liked: ${this.is_liked}
    }`;
  }
}