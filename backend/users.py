from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import case, desc, select
from utils import to_utc

from database import (
    AuthUser,
    UserProfile,
    PostLike,
    CommentLike,
    Post,
    SavedPost,
    Comment,
    Following
)
from auth import get_db, get_current_user 
import models
from typing import List, Optional


router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(get_current_user)]  # all routes require auth
)


# ---------------------------
# Get suggested users
# ---------------------------
@router.get("/suggestions", response_model=models.SuggestedUserResponse)
def get_user_suggestions(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    # Subquery of users the current user is already following
    following_subquery = (
        db.query(Following.following_id)
        .filter(Following.follower_id == current_user.id)
        .subquery()
    )

    # Build query — exclude yourself and prioritize unfollowed users
    users = (
        db.query(AuthUser)
        .options(joinedload(AuthUser.profile))
        .outerjoin(UserProfile, AuthUser.id == UserProfile.user_id)
        .filter(AuthUser.id != current_user.id)
        .filter(~AuthUser.id.in_(select(following_subquery.c.following_id)))
        .order_by(UserProfile.followers_count.desc())
        .limit(limit)
        .all()
    )


    # Build response
    result = []
    for user in users:
        profile = user.profile
        result.append({
            "user_id": user.id,
            "username": user.username,
            "full_name": profile.full_name if profile else None,
            "bio": profile.bio if profile else None,
            "avatar_url": profile.avatar_url if profile else None,
            "followers_count": profile.followers_count if profile else None,
            "following_count": profile.following_count if profile else None,
            "posts_count": profile.posts_count if profile else None,
            "is_following": False  # Always false for suggestions
        })

    return {"users": result}


@router.post("/follow", status_code=status.HTTP_200_OK)
def follow_user(data: models.FollowUserInput, db: Session = Depends(get_db), current_user: AuthUser = Depends(get_current_user)):
    user_to_follow = db.query(AuthUser).filter(AuthUser.id == data.following_user_id).first()
    if not user_to_follow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Check if trying to follow yourself
    if user_to_follow.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot follow yourself")

    # Check if already following
    existing_follow = db.query(Following).filter_by(follower_id=current_user.id, following_id=data.following_user_id).first()
    if existing_follow:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already following this user")

    # Create new follow relationship
    new_follow = Following(follower_id=current_user.id, following_id=data.following_user_id)
    db.add(new_follow)

    # Increment following count for both users
    current_user.profile.following_count += 1
    user_to_follow.profile.followers_count += 1

    db.commit()
    return Response(status_code=status.HTTP_200_OK)


@router.post("/unfollow", status_code=status.HTTP_200_OK)
def unfollow_user(data: models.FollowUserInput, db: Session = Depends(get_db), current_user: AuthUser = Depends(get_current_user)):
    user_to_unfollow = db.query(AuthUser).filter(AuthUser.id == data.following_user_id).first()
    if not user_to_unfollow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Check if trying to unfollow yourself
    if user_to_unfollow.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot unfollow yourself")

    # Check if already following
    existing_follow = db.query(Following).filter_by(follower_id=current_user.id, following_id=data.following_user_id).first()
    if not existing_follow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not following this user")

    db.delete(existing_follow)

    # Decrement following count for both users
    if current_user.profile.following_count > 0:
        current_user.profile.following_count -= 1
    if user_to_unfollow.profile.followers_count > 0:
        user_to_unfollow.profile.followers_count -= 1

    db.commit()
    return Response(status_code=status.HTTP_200_OK)


@router.post("/update-profile", status_code=status.HTTP_200_OK, response_model=models.UserProfileResponse)
def update_profile(
    data: models.UserProfileUpdateInput,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    if data.full_name is not None:
        profile.full_name = data.full_name
    if data.bio is not None:
        profile.bio = data.bio
    if data.avatar_url is not None:
        profile.avatar_url = data.avatar_url

    db.commit()
    db.refresh(profile)
    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "full_name": profile.full_name,
        "bio": profile.bio,
        "avatar_url": profile.avatar_url,
        "followers_count": profile.followers_count,
        "following_count": profile.following_count,
        "posts_count": profile.posts_count,
    }


# ---------------------------
# Get any user's profile
# ---------------------------
@router.get("/{username}", response_model=models.UserProfileResponse)
def get_user_profile(
    username: str,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    user = db.query(AuthUser).filter(AuthUser.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    profile = user.profile
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    is_following = db.query(Following).filter(
        Following.follower_id == current_user.id,
        Following.following_id == user.id
    ).first() is not None

    return {
        "user_id": user.id,
        "username": user.username,
        "full_name": profile.full_name,
        "bio": profile.bio,
        "avatar_url": profile.avatar_url,
        "followers_count": profile.followers_count,
        "following_count": profile.following_count,
        "posts_count": profile.posts_count,
        "is_following": is_following,
    }


# ---------------------------
# Get user's posts
# ---------------------------
@router.get("/{username}/posts", response_model=models.PaginatedPostsResponse)
def get_user_posts(
    username: str,
    offset: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    # Check if the user exists
    existing_user = db.query(AuthUser).filter(AuthUser.username == username).first()
    if not existing_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Eager-load user and profile for posts created by the user
    posts = (
        db.query(Post)
        .options(
            joinedload(Post.user)
            .joinedload(AuthUser.profile)
        )
        .filter(Post.user_id == existing_user.id)
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    post_ids = [post.id for post in posts]
    liked_post_ids = {
        like.post_id
        for like in db.query(PostLike).filter(
            PostLike.user_id == current_user.id,
            PostLike.post_id.in_(post_ids)
        ).all()
    }

    result = []
    for post in posts:
        user = post.user
        profile = user.profile

        result.append({
            "post_id": post.id,
            "image_url": post.image_url,
            "caption": post.caption,
            "created_at": to_utc(post.created_at),
            "likes_count": post.likes_count,
            "comments_count": post.comments_count,
            "location": {
                "name": post.location_name,
                "longitude": post.longitude,
                "latitude": post.latitude
            },
            "is_liked": post.id in liked_post_ids,
            "user": {
                "user_id": user.id,
                "username": user.username,
                "avatar_url": profile.avatar_url if profile else None
            }
        })

    # Determine if this is the last page
    is_end = len(posts) < limit
    return {"posts": result, "isEnd": is_end}



# ---------------------------
# Get liked posts for a user
# ---------------------------
@router.get("/{username}/liked-posts", response_model=models.PaginatedPostsResponse)
def get_liked_posts(
    username: str,
    offset: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    # Check if the user exists
    existing_user = db.query(AuthUser).filter(AuthUser.username == username).first()
    if not existing_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Get posts this user has liked (with related post → user → profile)
    liked_entries = (
        db.query(PostLike)
        .options(
            joinedload(PostLike.post)
            .joinedload(Post.user)
            .joinedload(AuthUser.profile)
        )
        .filter(PostLike.user_id == existing_user.id)
        .order_by(PostLike.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    post_ids = [like.post_id for like in liked_entries]

    # Check which liked posts are also liked by the current user
    liked_post_ids_by_current_user = {
        like.post_id
        for like in db.query(PostLike).filter(
            PostLike.user_id == current_user.id,
            PostLike.post_id.in_(post_ids)
        ).all()
    }

    result = []
    for like in liked_entries:
        post = like.post
        user = post.user
        profile = user.profile

        result.append({
            "post_id": post.id,
            "image_url": post.image_url,
            "caption": post.caption,
            "created_at": to_utc(post.created_at),
            "likes_count": post.likes_count,
            "comments_count": post.comments_count,
            "location": {
                "name": post.location_name,
                "longitude": post.longitude,
                "latitude": post.latitude
            },
            "is_liked": post.id in liked_post_ids_by_current_user,
            "user": {
                "user_id": user.id,
                "username": user.username,
                "avatar_url": profile.avatar_url if profile else None
            }
        })

    # Determine if this is the last page
    is_end = len(liked_entries) < limit
    return {"posts": result, "isEnd": is_end}


# ---------------------------
# Get saved posts for a user
# ---------------------------
@router.get("/{username}/saved-posts", response_model=models.PaginatedPostsResponse)
def get_saved_posts(
    username: str,
    offset: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    existing_user = db.query(AuthUser).filter(AuthUser.username == username).first()
    if not existing_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Eager-load post, user, and profile for saved posts
    saved_posts = (
        db.query(SavedPost)
        .options(
            joinedload(SavedPost.post)
            .joinedload(Post.user)
            .joinedload(AuthUser.profile)
        )
        .filter(SavedPost.user_id == existing_user.id)
        .order_by(SavedPost.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    # Gather post IDs to check for likes
    post_ids = [saved.post_id for saved in saved_posts]
    liked_post_ids = {
        like.post_id
        for like in db.query(PostLike).filter(
            PostLike.user_id == current_user.id,
            PostLike.post_id.in_(post_ids)
        ).all()
    }

    # Build the response
    result = []
    for saved in saved_posts:
        post = saved.post
        user = post.user
        profile = user.profile

        result.append({
            "post_id": post.id,
            "image_url": post.image_url,
            "caption": post.caption,
            "created_at": to_utc(post.created_at),
            "likes_count": post.likes_count,
            "comments_count": post.comments_count,
            "location": {
                "name": post.location_name,
                "longitude": post.longitude,
                "latitude": post.latitude
            },
            "is_liked": post.id in liked_post_ids,
            "user": {
                "user_id": user.id,
                "username": user.username,
                "avatar_url": profile.avatar_url if profile else None
            }
        })

    # Determine if this is the last page
    is_end = len(saved_posts) < limit
    return {"posts": result, "isEnd": is_end}