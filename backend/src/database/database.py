import sqlite3
import os
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_connection():
    conn = sqlite3.connect('./src/database/data.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(255) UNIQUE NOT NULL,
            displayName VARCHAR(255),
            avatar VARCHAR(255),
            bio VARCHAR(255),
            followers_count INTEGER DEFAULT 0,
            following_count INTEGER DEFAULT 0,
            posts_count INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS posts (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255),
            username VARCHAR(255) NOT NULL,
            content TEXT,
            created_at TIMESTAMP,
            updated_at TIMESTAMP,
            likes_count INTEGER DEFAULT 0,
            reposts_count INTEGER DEFAULT 0,
            comments_count INTEGER DEFAULT 0,
            views_count INTEGER DEFAULT 0,
            is_repost BOOLEAN DEFAULT 0,
            repost_original_id VARCHAR(255),
            FOREIGN KEY (username) REFERENCES users(username)
        )
        """)
        
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_posts_username ON posts(username)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)")
        
        conn.commit()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
        raise
    finally:
        conn.close()

def get_user_by_username(username):
    logger.info(f"Getting user by username: {username}")
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT * FROM users WHERE username = ?
        """, (username,))
        
        user = cursor.fetchone()
        if user:
            logger.info(f"User {username} found")
        else:
            logger.warning(f"User {username} not found")
        return user
    except Exception as e:
        logger.error(f"Error getting user {username}: {e}")
        return None
    finally:
        conn.close()

def upsert_user(data):
    username = data.get('username')
    logger.info(f"Upserting user: {username}")
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO users (
                username, displayName, avatar, bio, 
                followers_count, following_count, posts_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(username) DO UPDATE SET
                displayName = excluded.displayName,
                avatar = excluded.avatar,
                bio = excluded.bio,
                followers_count = excluded.followers_count,
                following_count = excluded.following_count,
                posts_count = excluded.posts_count,
                updated_at = CURRENT_TIMESTAMP
        """, (
            data.get('username'),
            data.get('displayName'),
            data.get('avatar'),
            data.get('bio'),
            data.get('followers_count', 0),
            data.get('following_count', 0),
            data.get('posts_count', 0)
        ))
        
        conn.commit()
        logger.info(f"User {username} upserted successfully")
        return True
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Error upserting user {username}: {e}")
        return False
    finally:
        conn.close()

def save_posts(posts_data):
    count = len(posts_data)
    logger.info(f"Saving {count} posts to database")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        saved_count = 0
        for post in posts_data:
            cursor.execute("""
                INSERT OR REPLACE INTO posts (
                    id, user_id, username, content, created_at, updated_at,
                    likes_count, reposts_count, comments_count, views_count,
                    is_repost, repost_original_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                post.get('id'),
                post.get('user_id'),
                post.get('username'),
                post.get('content'),
                post.get('created_at'),
                post.get('updated_at'),
                post.get('likes_count', 0),
                post.get('reposts_count', 0),
                post.get('comments_count', 0),
                post.get('views_count', 0),
                1 if post.get('is_repost', False) else 0,
                post.get('repost_original_id')
            ))
            saved_count += 1
        
        conn.commit()
        logger.info(f"Successfully saved {saved_count} posts")
        return saved_count
    except Exception as e:
        conn.rollback()
        logger.error(f"Error saving posts: {e}")
        return 0
    finally:
        conn.close()

def get_posts_by_username(username, limit=50, offset=0):
    logger.info(f"Getting posts for user {username}, limit {limit}, offset {offset}")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT * FROM posts 
            WHERE username = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        """, (username, limit, offset))
        
        posts = cursor.fetchall()
        result = [dict(post) for post in posts]
        logger.info(f"Found {len(result)} posts for user {username}")
        return result
    except Exception as e:
        logger.error(f"Error getting posts for user {username}: {e}")
        return []
    finally:
        conn.close()

def get_post_by_id(post_id):
    logger.info(f"Getting post by id: {post_id}")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM posts WHERE id = ?", (post_id,))
        post = cursor.fetchone()
        if post:
            logger.info(f"Post {post_id} found")
            return dict(post)
        else:
            logger.warning(f"Post {post_id} not found")
            return None
    except Exception as e:
        logger.error(f"Error getting post {post_id}: {e}")
        return None
    finally:
        conn.close()

def delete_old_posts(username, keep_count=100):
    logger.info(f"Deleting old posts for {username}, keeping {keep_count}")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            DELETE FROM posts 
            WHERE username = ? 
            AND id NOT IN (
                SELECT id FROM posts 
                WHERE username = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            )
        """, (username, username, keep_count))
        
        deleted = cursor.rowcount
        conn.commit()
        logger.info(f"Deleted {deleted} old posts for {username}")
        return deleted
    except Exception as e:
        conn.rollback()
        logger.error(f"Error deleting old posts for {username}: {e}")
        return 0
    finally:
        conn.close()

if __name__ == "__main__":
    init_db()