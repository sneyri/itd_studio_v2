from itdpy import ITDClient
import logging
logger = logging.getLogger(__name__)

class ITDService:
    def __init__(self, refresh_token: str):
        if not refresh_token:
            raise ValueError("refresh_token is required")
        self.refresh_token = refresh_token
        self.client = ITDClient(refresh_token=refresh_token)
        self.user_id = None
        self.username = None
        logger.info("ITDService initialized")

    def get_me(self):
        logger.info("Getting current user profile")
        try:
            result = self.client.users.me()
            self.user_id = result.id
            self.username = result.username
            logger.info(f"Profile retrieved for user: {result.username}")
            return result
        except Exception as e:
            logger.error(f"Error getting profile: {e}")
            raise

    def get_user(self, username: str):
        logger.info(f"Getting user profile: {username}")
        try:
            result = self.client.users.get(username)
            logger.info(f"Profile retrieved for user: {username}")
            return result
        except Exception as e:
            logger.error(f"Error getting user {username}: {e}")
            raise

    def get_user_posts(self, username: str, limit=100):
        logger.info(f"Getting posts for user: {username}, limit: {limit}")
        try:
            posts = self.client.posts.get_all_user_posts(username, limit=5000)
            logger.info(f"Retrieved {len(posts)} posts for user: {username}")
            return posts
        except Exception as e:
            logger.error(f"Error getting posts for user {username}: {e}")
            return []

    def close(self):
        logger.info("Closing ITDService")
        if hasattr(self.client, 'close'):
            self.client.close()