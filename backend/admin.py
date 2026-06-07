"""Admin API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from .auth import require_admin
from .database import (
    UserRecord,
    get_activity_logs,
    get_all_users,
    get_set_item_count,
    get_set_items,
    get_user_sets_by_user_id,
    get_user_stats,
    update_user_role,
)

admin_router = APIRouter(prefix="/api/admin")


class RoleUpdate(BaseModel):
    role: str


@admin_router.get("/users")
async def list_users(_admin: UserRecord = Depends(require_admin)):
    users = get_all_users()
    result = []
    for u in users:
        stats = get_user_stats(u.id)
        result.append({
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "role": u.role,
            "picture_url": u.picture_url,
            "last_login": u.last_login.isoformat(),
            "created_at": u.created_at.isoformat(),
            "song_count": stats["song_count"],
            "set_count": stats["set_count"],
        })
    return result


@admin_router.put("/users/{user_id}/role")
async def change_user_role(user_id: int, body: RoleUpdate, _admin: UserRecord = Depends(require_admin)):
    try:
        user = update_user_role(user_id, body.role)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True, "role": user.role}


@admin_router.get("/logs")
async def list_activity_logs(limit: int = 200, _admin: UserRecord = Depends(require_admin)):
    """Return the most recent activity log entries (newest first)."""
    if limit < 1 or limit > 1000:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 1000")
    logs = get_activity_logs(limit=limit)
    return [
        {
            "id": log.id,
            "user_email": log.user_email,
            "user_id": log.user_id,
            "action": log.action,
            "detail": log.detail,
            "status": log.status,
            "ip": log.ip,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]


@admin_router.get("/users/{user_id}/sets")
async def list_user_sets(user_id: int, _admin: UserRecord = Depends(require_admin)):
    sets = get_user_sets_by_user_id(user_id)
    result = []
    for s in sets:
        items = get_set_items(s.id)
        result.append({
            "id": s.id,
            "name": s.name,
            "item_count": len(items),
            "items": [
                {
                    "id": item.id,
                    "tune_title": item.tune_title,
                    "tune_source": item.tune_source,
                    "position": item.position,
                }
                for item in items
            ],
            "created_at": s.created_at.isoformat(),
            "updated_at": s.updated_at.isoformat(),
        })
    return result
