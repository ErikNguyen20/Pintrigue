export class User {
  constructor(data) {
    this.id = data.user_id || null;
    this.username = data.username;
    this.full_name = data.full_name || "";
    this.bio = data.bio || "";
    this.avatar_url = data.avatar_url;
    this.followers_count = data.followers_count || 0;
    this.following_count = data.following_count || 0;
    this.posts_count = data.posts_count || 0;
    this.is_following = data.is_following || false;
  }

  get displayName() {
    return this.username;
  }

  toString() {
    return `User {
      id: ${this.id},
      username: "${this.username}",
      full_name: "${this.full_name}",
      bio: "${this.bio}",
      avatar_url: "${this.avatar_url}",
      followers: ${this.followers_count},
      following: ${this.following_count},
      posts: ${this.posts_count},
      is_following: ${this.is_following}
    }`;
  }

}