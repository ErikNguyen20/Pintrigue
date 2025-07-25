from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, DateTime, Float, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func


DATABASE_URL = "sqlite:///./test.db"  # swap for Postgres later

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ======================
# AuthUser
# ======================
class AuthUser(Base):
    __tablename__ = "auth_users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    google_id = Column(String, unique=True, nullable=True)

    refresh_tokens = relationship("AuthRefreshToken", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    post_likes = relationship("PostLike", back_populates="user", cascade="all, delete-orphan")
    comment_likes = relationship("CommentLike", back_populates="user", cascade="all, delete-orphan")
    saved_posts = relationship("SavedPost", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    followers = relationship("Following", foreign_keys="[Following.following_id]", back_populates="following", cascade="all, delete-orphan")
    following = relationship("Following", foreign_keys="[Following.follower_id]", back_populates="follower", cascade="all, delete-orphan")


# ======================
# AuthRefreshToken
# ======================
class AuthRefreshToken(Base):
    __tablename__ = "auth_refresh_tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("auth_users.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("AuthUser", back_populates="refresh_tokens")


# ======================
# Post
# ======================
class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("auth_users.id"), nullable=False)
    image_url = Column(String, nullable=False)
    caption = Column(String, nullable=True)
    geoHash = Column(String, nullable=True)
    location_name = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)

    user = relationship("AuthUser", back_populates="posts")
    likes = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    saved_by = relationship("SavedPost", back_populates="post", cascade="all, delete-orphan")

# ======================
# PostLike (composite PK)
# ======================
class PostLike(Base):
    __tablename__ = "post_likes"
    user_id = Column(Integer, ForeignKey("auth_users.id"), primary_key=True)
    post_id = Column(Integer, ForeignKey("posts.id"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("AuthUser", back_populates="post_likes")
    post = relationship("Post", back_populates="likes")


# ======================
# Comment
# ======================
class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("auth_users.id"), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    likes_count = Column(Integer, default=0)

    user = relationship("AuthUser", back_populates="comments")
    post = relationship("Post", back_populates="comments")
    likes = relationship("CommentLike", back_populates="comment", cascade="all, delete-orphan")


# ======================
# CommentLike (composite PK)
# ======================
class CommentLike(Base):
    __tablename__ = "comment_likes"
    user_id = Column(Integer, ForeignKey("auth_users.id"), primary_key=True)
    comment_id = Column(Integer, ForeignKey("comments.id"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("AuthUser", back_populates="comment_likes")
    comment = relationship("Comment", back_populates="likes")


# ======================
# SavedPost (composite PK)
# ======================
class SavedPost(Base):
    __tablename__ = "saved_posts"
    user_id = Column(Integer, ForeignKey("auth_users.id"), primary_key=True)
    post_id = Column(Integer, ForeignKey("posts.id"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("AuthUser", back_populates="saved_posts")
    post = relationship("Post", back_populates="saved_by")

# ======================
# Following (composite PK)
# ======================
class Following(Base):
    __tablename__ = "followings"

    follower_id = Column(Integer, ForeignKey("auth_users.id"), primary_key=True)
    following_id = Column(Integer, ForeignKey("auth_users.id"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    follower = relationship("AuthUser", foreign_keys=[follower_id], back_populates="following")
    following = relationship("AuthUser", foreign_keys=[following_id], back_populates="followers")

# ======================
# UserProfile (1:1)
# ======================
class UserProfile(Base):
    __tablename__ = "user_profiles"
    user_id = Column(Integer, ForeignKey("auth_users.id"), primary_key=True)
    full_name = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    posts_count = Column(Integer, default=0)

    user = relationship("AuthUser", back_populates="profile")
