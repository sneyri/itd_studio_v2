"""HTTP-эндпоинты постов текущего пользователя (/api/posts)."""

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.modules.posts.repository import PostsRepository
from app.modules.posts.schemas import PostSort, PostsPage, to_post_out

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("", response_model=PostsPage, summary="Посты с пагинацией и сортировкой")
def list_posts(
    user: CurrentUser,
    db: DbSession,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    sort: PostSort = "new",
):
    items, total = PostsRepository(db).page(user.id, limit, offset, sort)
    return PostsPage(items=[to_post_out(p, user.username) for p in items], total=total, limit=limit, offset=offset)
