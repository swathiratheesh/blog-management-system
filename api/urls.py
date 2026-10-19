from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    CommentCreateView,
    CommentDetailView,
    CustomLoginView,
    PostViewSet,
    register_view,
)

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')

urlpatterns = [
    # Router paths become /api/posts/
    path('api/', include(router.urls)),
    
    # Comments paths become /api/posts/... and /api/comments/...
    path('api/posts/<int:post_id>/comments/', CommentCreateView.as_view(), name='comment-create'),
    path('api/comments/<int:pk>/', CommentDetailView.as_view(), name='comment-detail'),
    
    # Auth paths become /api/login/ and /api/register/
    path('api/login/', CustomLoginView.as_view(), name='login'),
    path('api/register/', register_view, name='register'),
]