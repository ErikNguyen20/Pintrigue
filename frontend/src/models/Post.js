import { User } from './User';
import { Location } from './Location';

export class Post {
  constructor(data) {
    this.id = data.post_id || null;
    this.user = new User(data.user || {});
    this.created_at = data.created_at ? new Date(data.created_at) : null;
    this.caption = data.caption || "";
    this.image_url = data.image_url;
    this.location = new Location(data.location || {});

    this.is_liked = data.is_liked || false;
    this.likes_count = data.likes_count || 0;
    this.comments_count = data.comments_count || 0;
  }

  get displayName() {
    return this.user.username;
  }

  toString() {
    return `Post {
      id: ${this.id},
      user: ${this.user.toString()},
      created_at: ${this.created_at},
      caption: "${this.caption}",
      image_url: "${this.image_url}",
      location: ${this.location.toString()},
      is_liked: ${this.is_liked},
      likes_count: ${this.likes_count},
      comments_count: ${this.comments_count}
    }`;
  }
}
