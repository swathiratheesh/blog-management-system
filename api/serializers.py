from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Comment, Post


class UserSerializer(serializers.ModelSerializer):

  class Meta:
    model = User
    fields = ['id', 'username']


class CommentSerializer(serializers.ModelSerializer):
  author = UserSerializer(read_only=True)

  class Meta:
    model = Comment
    fields = ['id', 'post', 'author', 'content', 'created_at']
    read_only_fields = ['post', 'author']


class PostSerializer(serializers.ModelSerializer):
  author = UserSerializer(read_only=True)
  comments = CommentSerializer(many=True, read_only=True)

  class Meta:
    model = Post
    fields = [
        'id',
        'title',
        'content',
        'author',
        'created_at',
        'updated_at',
        'comments',
    ]
    read_only_fields = ['author']