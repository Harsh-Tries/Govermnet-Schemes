from typing import List
from fastapi import HTTPException, status, Header
from app.enums import UserRole

def require_roles(allowed_roles: List[UserRole]):
    """
    FastAPI dependency factory enforcing Role-Based Access Control (RBAC).
    Extracts role from X-User-Role header or token.
    """
    def _role_checker(x_user_role: str = Header(default="CITIZEN")):
        try:
            role = UserRole(x_user_role.upper())
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Invalid user role '{x_user_role}'"
            )

        if role not in allowed_roles and role != UserRole.ADMIN and role != UserRole.SYSTEM_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role.value}' is not authorized for this resource. Allowed roles: {[r.value for r in allowed_roles]}"
            )
        return role

    return _role_checker
