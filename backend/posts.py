from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import case, desc, select, or_

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
from utils import to_utc, get_location_name_from_coords, get_geohash_precision_from_zoom, haversine, minmax_scale
from datetime import datetime, timezone
import geohash


router = APIRouter(
    prefix="/posts",
    tags=["posts"],
    dependencies=[Depends(get_current_user)]  # all routes require auth
)


# ---------------------------
# Get feed for a user
# ---------------------------
@router.get("/feed", response_model=models.PaginatedPostsResponse)
def get_feed(
    offset: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    # Query once: get following IDs as a list
    following_ids_list = db.query(Following.following_id).filter(
        Following.follower_id == current_user.id
    ).all()

    # Convert to set of ints for fast lookup in Python
    following_ids = {row[0] for row in following_ids_list}

    # Build SQL subquery from the same list
    posts = (
        db.query(
            Post,
            case(
                (Post.user_id.in_(following_ids), 1),
                else_=0
            ).label("priority")
        )
        .options(
            joinedload(Post.user).joinedload(AuthUser.profile)
        )
        .order_by(desc("priority"), Post.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


    # Extract post objects
    post_objs = [post for post, _ in posts]
    post_ids = [post.id for post in post_objs]

    # Find which of these posts the current user has liked
    liked_post_ids = {
        like.post_id
        for like in db.query(PostLike).filter(
            PostLike.user_id == current_user.id,
            PostLike.post_id.in_(post_ids)
        ).all()
    }

    # Build response
    result = []
    for post, _ in posts:
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
                "avatar_url": profile.avatar_url if profile else None,
                "is_following": user.id in following_ids,
            }
        })

    # Determine if this is the last page
    is_end = len(post_objs) < limit
    return {"posts": result, "isEnd": is_end}


@router.get("/geographic-nearby", response_model=models.NearbyPostsResponse)
def geographic_nearby_feed(
    latitude: float,
    longitude: float,
    zoom: int = Query(5, ge=1, le=18),
    following_only: bool = Query(False),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
        raise HTTPException(status_code=400, detail="Invalid latitude or longitude")
    
    # Get geohash precision based on zoom level
    precision = get_geohash_precision_from_zoom(zoom)
    user_geohash = geohash.encode(latitude, longitude, precision=8)
    user_geohash = user_geohash[:precision]
    neighbors = geohash.neighbors(user_geohash)
    all_hashes = [user_geohash] + neighbors

    # Preselect nearby posts (limit to limit*5 for performance)
    query = db.query(Post).filter(or_(*[Post.geoHash.startswith(h) for h in all_hashes]))

    # If following_only is True, filter to only posts from followed users
    if following_only:
        following_ids = db.query(Following.following_id).filter(
            Following.follower_id == current_user.id
        ).all()
        following_ids_set = {row[0] for row in following_ids}
        query = query.filter(Post.user_id.in_(following_ids_set))

    preselected_posts = query.order_by(Post.created_at.desc()).limit(limit * 5).all()

    # If no posts found, return empty response
    if not preselected_posts:
        return models.NearbyPostsResponse(posts=[])

    # Calculate raw metrics and store
    now = datetime.now(timezone.utc)
    age_list = []
    popularity_list = []
    distance_list = []
    metrics = []

    for post in preselected_posts:
        age_seconds = (now - to_utc(post.created_at)).total_seconds()
        popularity = post.likes_count + post.comments_count
        distance_km = haversine(latitude, longitude, post.latitude, post.longitude)
        metrics.append((age_seconds, popularity, distance_km, post))
        age_list.append(age_seconds)
        popularity_list.append(popularity)
        distance_list.append(distance_km)

    # Get min/max for scaling
    min_age, max_age = min(age_list), max(age_list)
    min_pop, max_pop = min(popularity_list), max(popularity_list)
    min_dist, max_dist = min(distance_list), max(distance_list)

    scored_posts = []
    for age, pop, dist, post in metrics:
        age_scaled = 1 - minmax_scale(age, min_age, max_age)
        pop_scaled = minmax_scale(pop, min_pop, max_pop)
        dist_scaled = 1 - minmax_scale(dist, min_dist, max_dist)
        
        # Higher score is better
        score = 0.5 * age_scaled + 0.3 * pop_scaled + 0.2 * dist_scaled
        scored_posts.append((score, post))


    # Sort by score descending
    scored_posts.sort(reverse=True, key=lambda x: x[0])
    final_posts = [p for _, p in scored_posts[:limit]]
    post_ids = [post.id for post in final_posts]


    # Find which of these posts the current user has liked
    liked_post_ids = {
        like.post_id
        for like in db.query(PostLike).filter(
            PostLike.user_id == current_user.id,
            PostLike.post_id.in_(post_ids)
        ).all()
    }

    # Query once: get following IDs as a list
    following_ids_list = db.query(Following.following_id).filter(
        Following.follower_id == current_user.id
    ).all()

    # Convert to set of ints for fast lookup in Python
    following_ids = {row[0] for row in following_ids_list}

    # Build response
    result = []
    for post in final_posts:
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
                "avatar_url": profile.avatar_url if profile else None,
                "is_following": user.id in following_ids,
            }
        })

    return models.NearbyPostsResponse(posts=result)

    

# ---------------------------
# Like a post
# ---------------------------
@router.post("/like", status_code=status.HTTP_200_OK)
def like_post(data: models.PostLikeInput, db: Session = Depends(get_db), current_user: AuthUser = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == data.post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # Check if user already liked the post
    existing_like = db.query(PostLike).filter_by(user_id=current_user.id, post_id=data.post_id).first()
    if existing_like:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Post already liked by this user")

    # Create new like
    new_like = PostLike(user_id=current_user.id, post_id=data.post_id)
    db.add(new_like)

    # Increment like count
    post.likes_count += 1

    db.commit()
    return Response(status_code=status.HTTP_200_OK)


# ---------------------------
# Unlike a post
# ---------------------------
@router.post("/unlike", status_code=status.HTTP_200_OK)
def unlike_post(data: models.PostLikeInput, db: Session = Depends(get_db), current_user: AuthUser = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == data.post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # Check if user already liked the post
    like = db.query(PostLike).filter_by(user_id=current_user.id, post_id=data.post_id).first()
    if not like:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Like not found for this user")

    db.delete(like)

    # Decrement like count
    if post.likes_count > 0:
        post.likes_count -= 1

    db.commit()
    return Response(status_code=status.HTTP_200_OK)


# ---------------------------
# Like a comment
# ---------------------------
@router.post("/like-comment", status_code=status.HTTP_200_OK)
def like_comment(data: models.CommentLikeInput, db: Session = Depends(get_db), current_user: AuthUser = Depends(get_current_user)):
    comment = db.query(Comment).filter(Comment.id == data.comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    # Check if user already liked the comment
    existing_like = db.query(CommentLike).filter_by(user_id=current_user.id, comment_id=data.comment_id).first()
    if existing_like:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Comment already liked by this user")

    # Create new like
    new_like = CommentLike(user_id=current_user.id, comment_id=data.comment_id)
    db.add(new_like)

    # Increment like count
    comment.likes_count += 1

    db.commit()
    return Response(status_code=status.HTTP_200_OK)


# ---------------------------
# Unlike a comment
# ---------------------------
@router.post("/unlike-comment", status_code=status.HTTP_200_OK)
def unlike_comment(data: models.CommentLikeInput, db: Session = Depends(get_db), current_user: AuthUser = Depends(get_current_user)):
    comment = db.query(Comment).filter(Comment.id == data.comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    # Check if user already liked the comment
    like = db.query(CommentLike).filter_by(user_id=current_user.id, comment_id=data.comment_id).first()
    if not like:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Like not found for this user")

    db.delete(like)

    # Decrement like count
    if comment.likes_count > 0:
        comment.likes_count -= 1

    db.commit()
    return Response(status_code=status.HTTP_200_OK)


# ---------------------------
# Save a post
# ---------------------------
@router.post("/save-post", status_code=status.HTTP_200_OK)
def save_post(data: models.SavedPostInput, db: Session = Depends(get_db), current_user: AuthUser = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == data.post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # Check if user already saved the post
    existing_save = db.query(SavedPost).filter_by(user_id=current_user.id, post_id=data.post_id).first()
    if existing_save:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Post already saved by this user")

    # Create new save
    new_save = SavedPost(user_id=current_user.id, post_id=data.post_id)
    db.add(new_save)

    db.commit()
    return Response(status_code=status.HTTP_200_OK)


# ---------------------------
# Unsave a post
# ---------------------------
@router.post("/unsave-post", status_code=status.HTTP_200_OK)
def unsave_post(data: models.SavedPostInput, db: Session = Depends(get_db), current_user: AuthUser = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == data.post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # Check if user already saved the post
    save = db.query(SavedPost).filter_by(user_id=current_user.id, post_id=data.post_id).first()
    if not save:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Save not found for this user")

    db.delete(save)

    db.commit()
    return Response(status_code=status.HTTP_200_OK)


# ---------------------------
# Create a new post
# ---------------------------
@router.post("/create", status_code=status.HTTP_201_CREATED, response_model=models.CreatePostResponse)
def create_post(
    data: models.PostCreateInput,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    geo_hash = None
    if data.latitude is not None and data.longitude is not None:
        # Validate coordinates
        if not (-90 <= data.latitude <= 90) or not (-180 <= data.longitude <= 180):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid latitude or longitude")

        # Generate geohash for the location
        geo_hash = geohash.encode(data.latitude, data.longitude, precision=8)

        # Currently overrides location_name if provided
        data.location_name = get_location_name_from_coords(data.latitude, data.longitude)

    new_post = Post(
        user_id=current_user.id,
        image_url=data.image_url,
        caption=data.caption,
        location_name=data.location_name,
        latitude=data.latitude,
        longitude=data.longitude,
        geoHash=geo_hash
    )
    db.add(new_post)

    # Increment user's post count
    current_user.profile.posts_count += 1

    db.commit()
    db.refresh(new_post)
    return {"post_id": new_post.id}


# ---------------------------
# Delete a post
# ---------------------------
@router.post("/delete", status_code=status.HTTP_200_OK)
def delete_post(
    data: models.DeletePostInput,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == data.post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this post")

    db.delete(post)

    # Decrement user's post count
    if current_user.profile.posts_count > 0:
        current_user.profile.posts_count -= 1

    db.commit()
    return Response(status_code=status.HTTP_200_OK)


# ---------------------------
# Add a comment to a post
# ---------------------------
@router.post("/add-comment", status_code=status.HTTP_201_CREATED, response_model=models.CommentResponse)
def add_comment(
    data: models.CommentCreateInput,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == data.post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    new_comment = Comment(
        post_id=data.post_id,
        user_id=current_user.id,
        content=data.content
    )
    db.add(new_comment)
    post.comments_count += 1
    db.commit()
    db.refresh(new_comment)

    return {
        "comment_id": new_comment.id,
        "content": new_comment.content,
        "created_at": to_utc(new_comment.created_at),
        "likes_count": 0,  # Initially zero
        "is_liked": False,  # Initially false
        "user": {
            "user_id": new_comment.user.id,
            "username": new_comment.user.username,
            "avatar_url": new_comment.user.profile.avatar_url if new_comment.user.profile else None,
        }
    }


# ---------------------------
# Get comments for a post
# ---------------------------
@router.get("/{post_id}/comments", response_model=models.PaginatedCommentsResponse)
def get_post_comments(
    post_id: int,
    offset: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    # Validate post exists
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # Eager-load user and profile on each comment
    comments = (
        db.query(Comment)
        .options(
            joinedload(Comment.user).joinedload(AuthUser.profile)
        )
        .filter(Comment.post_id == post_id)
        .order_by(Comment.likes_count.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    # Batch load liked comment IDs
    comment_ids = [comment.id for comment in comments]
    liked_comment_ids = {
        like.comment_id
        for like in db.query(CommentLike).filter(
            CommentLike.user_id == current_user.id,
            CommentLike.comment_id.in_(comment_ids)
        ).all()
    }

    # Format response
    result = []
    for comment in comments:
        result.append({
            "comment_id": comment.id,
            "content": comment.content,
            "created_at": to_utc(comment.created_at),
            "likes_count": comment.likes_count,
            "is_liked": comment.id in liked_comment_ids,
            "user": {
                "user_id": comment.user.id,
                "username": comment.user.username,
                "avatar_url": comment.user.profile.avatar_url if comment.user.profile else None,
            }
        })

    # Determine if this is the last page
    is_end = len(comments) < limit
    return {"comments": result, "isEnd": is_end}