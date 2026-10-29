from typing import List, Union
from fastapi import HTTPException, status, Depends
from app.enums import UserRole
from app.models.user import User
from app.core.auth import get_current_user

def require_roles(allowed_roles: List[UserRole]):
    """
    FastAPI dependency factory enforcing server-side Role-Based Access Control (RBAC).
    
    Security Guarantee:
    - Derives role strictly from the authenticated database User record.
    - NEVER inspects or trusts client-supplied headers (e.g. X-Role, X-User-Role).
    - Fails closed with 401 if unauthenticated and 403 if unauthorized.
    """
    def _role_checker(
        user_or_dep: Union[User, UserRole, str] = Depends(get_current_user)
    ) -> UserRole:
        # Resolve user role from server-side object
        if isinstance(user_or_dep, User):
            role_str = user_or_dep.role
        elif isinstance(user_or_dep, UserRole):
            role_str = user_or_dep.value
        elif isinstance(user_or_dep, str):
            role_str = user_or_dep
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required."
            )

        try:
            role = UserRole(role_str.upper())
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Invalid or unrecognized user role '{role_str}'"
            )

        # ADMIN and SYSTEM_ADMIN have full supervisory privileges
        if role not in allowed_roles and role != UserRole.ADMIN and role != UserRole.SYSTEM_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role.value}' is not authorized for this resource. Required roles: {[r.value for r in allowed_roles]}"
            )
        return role

    return _role_checker
