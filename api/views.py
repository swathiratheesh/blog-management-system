from rest_framework import generics, permissions, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.response import Response
from .models import Comment, Post
from .permissions import IsOwnerOrReadOnly
from .serializers import CommentSerializer, PostSerializer
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User


class PostViewSet(viewsets.ModelViewSet):
  queryset = Post.objects.all().order_by('-created_at')
  serializer_class = PostSerializer
  permission_classes = [
    permissions.IsAuthenticatedOrReadOnly,
    IsOwnerOrReadOnly,
]

  def perform_create(self, serializer):
    serializer.save(author=self.request.user)


class CommentCreateView(generics.CreateAPIView):
  queryset = Comment.objects.all()
  serializer_class = CommentSerializer
  permission_classes = [permissions.IsAuthenticated]

  def perform_create(self, serializer):
    post_id = self.kwargs.get('post_id')
    post = Post.objects.get(pk=post_id)
    serializer.save(author=self.request.user, post=post)


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
  queryset = Comment.objects.all()
  serializer_class = CommentSerializer
  permission_classes = [
      permissions.IsAuthenticatedOrReadOnly,
      IsOwnerOrReadOnly,
  ]


class CustomLoginView(ObtainAuthToken):

  def post(self, request, *args, **kwargs):
    response = super().post(request, *args, **kwargs)
    token = Token.objects.get(key=response.data['token'])
    user = token.user
    return Response({
        'token': token.key,
        'user_id': user.id,
        'username': user.username,
    })
  
@api_view(['POST'])
def register_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    # Create the user and hash the password properly
    user = User.objects.create_user(username=username, password=password)
    return Response({'message': 'User registered successfully!'}, status=status.HTTP_201_CREATED)