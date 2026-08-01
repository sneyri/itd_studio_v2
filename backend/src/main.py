from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from tests.test_analytics import test_data

from src.database.database import (
    init_db,
    upsert_user, get_user_by_username,
    save_posts, get_posts_by_username, get_post_by_id
)

from src.services.ITDService import ITDService
from src.config import API_URL
from src.services.analytics.growth_service import build_followers_growth_series, build_growth_series
from src.services.analytics.overview_service import build_overview_payload
from src.services.analytics.posting_time_service import calculate_best_posting_time

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Инициализируем базу данных
init_db()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# ============================================================================
# ОСНОВНЫЕ ЭНДПОИНТЫ
# ============================================================================

@app.get(API_URL + "status")
def status():
    return {"message": "ok"}


@app.post(API_URL + "sync/{refresh_token}")
def sync_user_data(refresh_token: str):
    logger.info("=" * 50)
    logger.info("STARTING FULL SYNC")
    logger.info("=" * 50)
    
    try:
        service = ITDService(refresh_token)
        
        logger.info("Getting profile...")
        profile = service.get_me()
        logger.info(f"Profile received: {profile.username}")
        
        user_data = {
            'username': profile.username,
            'displayName': profile.display_name,
            'avatar': profile.avatar,
            'bio': profile.bio,
            'followers_count': profile.followers_count,
            'following_count': profile.following_count,
            'posts_count': profile.posts_count,
        }
        upsert_user(user_data)
        logger.info("Profile saved")
        
        logger.info("Getting posts...")
        posts = service.get_user_posts(profile.username, limit=200)
        logger.info(f"Posts received: {len(posts)}")
        
        posts_data = []
        for idx, post in enumerate(posts):
            try:
                post_dict = {
                    'id': post.id,
                    'user_id': post.user_id if hasattr(post, 'user_id') else None,
                    'username': post.username if hasattr(post, 'username') else profile.username,
                    'content': post.content if hasattr(post, 'content') else None,
                    'created_at': post.created_at if hasattr(post, 'created_at') else None,
                    'updated_at': post.updated_at if hasattr(post, 'updated_at') else None,
                    'likes_count': post.likes_count if hasattr(post, 'likes_count') else 0,
                    'reposts_count': post.reposts_count if hasattr(post, 'reposts_count') else 0,
                    'comments_count': post.comments_count if hasattr(post, 'comments_count') else 0,
                    'views_count': post.views_count if hasattr(post, 'views_count') else 0,
                    'is_repost': post.is_repost if hasattr(post, 'is_repost') else False,
                    'repost_original_id': post.repost_original_id if hasattr(post, 'repost_original_id') else None
                }
                posts_data.append(post_dict)
            except Exception as e:
                logger.error(f"Error processing post {idx}: {str(e)}")
        
        saved_posts = save_posts(posts_data)
        logger.info(f"Posts saved: {saved_posts}")

        service.close()
        
        logger.info("=" * 50)
        logger.info(f"SYNC COMPLETED: Posts: {saved_posts}")
        logger.info("=" * 50)
        
        return {
            "status": "success",
            "message": "Данные успешно синхронизированы",
            "data": {
                "user": user_data,
                "posts_saved": saved_posts,
            }
        }
        
    except Exception as e:
        logger.error("=" * 50)
        logger.error(f"SYNC ERROR: {str(e)}")
        logger.error("=" * 50)
        return {
            "status": "error",
            "detail": f"Ошибка при синхронизации: {str(e)}"
        }


@app.get(API_URL + "user/{username}")
def get_user(username: str):
    logger.info(f"Getting user: {username}")
    try:
        user = get_user_by_username(username)
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail=f"Пользователь с username '{username}' не найден"
            )
        
        return {
            "status": "success",
            "data": dict(user)
        }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user {username}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка сервера: {str(e)}"
        )


@app.get(API_URL + "user/{username}/posts")
def get_user_posts(username: str, limit: int = 50, offset: int = 0):
    logger.info(f"Getting posts for user: {username}, limit: {limit}, offset: {offset}")
    try:
        user = get_user_by_username(username)
        if not user:
            raise HTTPException(
                status_code=404,
                detail=f"Пользователь '{username}' не найден"
            )
        
        posts = get_posts_by_username(username, limit, offset)
        return {
            "status": "success",
            "data": {
                "username": username,
                "posts": posts,
                "count": len(posts)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting posts for {username}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка получения постов: {str(e)}"
        )


@app.get(API_URL + "post/{post_id}")
def get_post(post_id: str):
    logger.info(f"Getting post by id: {post_id}")
    try:
        post = get_post_by_id(post_id)
        if not post:
            raise HTTPException(
                status_code=404,
                detail=f"Пост с ID '{post_id}' не найден"
            )
        
        return {
            "status": "success",
            "data": post
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting post {post_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка получения поста: {str(e)}"
        )


# ============================================================================
# ЭНДПОИНТЫ АНАЛИТИКИ
# ============================================================================

@app.get(API_URL + "analytics/{username}/overview")
def get_analytics_overview(username: str):
    """
    Получение общей статистики аккаунта
    """
    logger.info(f"Getting analytics overview for user: {username}")
    try:
        user = get_user_by_username(username)
        if not user:
            raise HTTPException(
                status_code=404,
                detail=f"Пользователь '{username}' не найден"
            )
        
        user_dict = dict(user)
        posts = get_posts_by_username(username, limit=999999)
        
        result = build_overview_payload(username, user_dict, posts)

        return {
            "status": "success",
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analytics overview for {username}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка получения аналитики: {str(e)}"
        )


@app.get(API_URL + "analytics/{username}/growth/likes")
def get_likes_growth(username: str):
    """
    Получение данных для графика роста лайков
    """
    logger.info(f"Getting likes growth for user: {username}")
    try:
        user = get_user_by_username(username)
        if not user:
            raise HTTPException(
                status_code=404,
                detail=f"Пользователь '{username}' не найден"
            )
        
        data = build_growth_series(get_posts_by_username(username, limit=999999), 'likes')

        return {
            "status": "success",
            "data": data
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting likes growth for {username}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка получения данных: {str(e)}"
        )


@app.get(API_URL + "analytics/{username}/growth/comments")
def get_comments_growth(username: str):
    """
    Получение данных для графика роста комментариев
    """
    logger.info(f"Getting comments growth for user: {username}")
    try:
        user = get_user_by_username(username)
        if not user:
            raise HTTPException(
                status_code=404,
                detail=f"Пользователь '{username}' не найден"
            )
        
        data = build_growth_series(get_posts_by_username(username, limit=999999), 'comments')

        return {
            "status": "success",
            "data": data
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting comments growth for {username}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка получения данных: {str(e)}"
        )


@app.get(API_URL + "analytics/{username}/growth/reposts")
def get_reposts_growth(username: str):
    """
    Получение данных для графика роста репостов
    """
    logger.info(f"Getting reposts growth for user: {username}")
    try:
        user = get_user_by_username(username)
        if not user:
            raise HTTPException(
                status_code=404,
                detail=f"Пользователь '{username}' не найден"
            )
        
        data = build_growth_series(get_posts_by_username(username, limit=999999), 'reposts')

        return {
            "status": "success",
            "data": data
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting reposts growth for {username}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка получения данных: {str(e)}"
        )


@app.get(API_URL + "analytics/{username}/growth/views")
def get_views_growth(username: str):
    """
    Получение данных для графика роста просмотров
    """
    logger.info(f"Getting views growth for user: {username}")
    try:
        user = get_user_by_username(username)
        if not user:
            raise HTTPException(
                status_code=404,
                detail=f"Пользователь '{username}' не найден"
            )

        data = build_growth_series(get_posts_by_username(username, limit=999999), 'views')

        return {
            "status": "success",
            "data": data
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting views growth for {username}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка получения данных: {str(e)}"
        )


@app.get(API_URL + "analytics/{username}/growth/followers")
def get_followers_growth(username: str):
    """
    Получение данных для графика роста подписчиков
    """
    logger.info(f"Getting followers growth for user: {username}")
    try:
        user = get_user_by_username(username)
        if not user:
            raise HTTPException(
                status_code=404,
                detail=f"Пользователь '{username}' не найден"
            )
        
        user_dict = dict(user)
        posts = get_posts_by_username(username, limit=999999)

        data = build_followers_growth_series(posts, user_dict.get('followers_count', 0))

        return {
            "status": "success",
            "data": data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting followers growth for {username}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка получения данных: {str(e)}"
        )