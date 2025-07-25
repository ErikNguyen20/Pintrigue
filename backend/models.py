from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Data Models:
class LocationModel(BaseModel):
    name: Optional[str] = None
    longitude: Optional[float] = None
    latitude: Optional[float] = None


# Authentication Models
class UserCreateInput(BaseModel):
    email: str
    username: str
    password: str

class UserLoginInput(BaseModel):
    username: str
    password: str

class GoogleCallbackInput(BaseModel):
    code: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None


# User Profile Models
class UserProfileUpdateInput(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class FollowUserInput(BaseModel):
    following_user_id: int

class SavedPostInput(BaseModel):
    post_id: int

class UserProfileResponse(BaseModel):
    user_id: Optional[int] = None
    username: str
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    followers_count: Optional[int] = None
    following_count: Optional[int] = None
    posts_count: Optional[int] = None
    is_following: Optional[bool] = None

class SuggestedUserResponse(BaseModel):
    users: List[UserProfileResponse]


# Post Models
class PostCreateInput(BaseModel):
    image_url: str
    caption: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class DeletePostInput(BaseModel):
    post_id: int

class PostLikeInput(BaseModel):
    post_id: int

class PostResponse(BaseModel):
    post_id: Optional[int] = None
    user: Optional[UserProfileResponse] = None
    created_at: datetime
    caption: Optional[str] = None
    image_url: str
    location: Optional[LocationModel] = None
    is_liked: Optional[bool] = None
    likes_count: int
    comments_count: int

class PaginatedPostsResponse(BaseModel):
    posts: List[PostResponse]
    isEnd: bool = Field(..., alias="isEnd")

class NearbyPostsResponse(BaseModel):
    posts: List[PostResponse]

class CreatePostResponse(BaseModel):
    post_id: int


# Comment Models
class CommentCreateInput(BaseModel):
    post_id: int
    content: str

class CommentLikeInput(BaseModel):
    comment_id: int

class CommentResponse(BaseModel):
    comment_id: Optional[int] = None
    user: UserProfileResponse
    created_at: datetime
    content: str
    likes_count: Optional[int] = None
    is_liked: Optional[bool] = None

class PaginatedCommentsResponse(BaseModel):
    comments: List[CommentResponse]
    isEnd: bool = Field(..., alias="isEnd")


# File Upload Models
class FileUploadResponse(BaseModel):
    url: str


