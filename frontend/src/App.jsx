import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('authToken') || null);
  const [currentUsername, setCurrentUsername] = useState(() => localStorage.getItem('username') || '');
  const [password, setPassword] = useState('');
  
  // Toggle between login and register views
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Post State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Edit Post State
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Comment Input State per Post ID
  const [commentInputs, setCommentInputs] = useState({});

  // Edit Comment State
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/posts/');
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPosts();
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUsername, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || 'Login failed');

      setToken(data.token);
      setCurrentUsername(currentUsername);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('username', currentUsername);
      setPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUsername, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || JSON.stringify(data) || 'Registration failed');

      alert('Registration successful! Please log in.');
      setIsRegistering(false);
      setPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUsername('');
    localStorage.clear();
  };

  // --- POST ACTIONS ---
  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8000/api/posts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error('Failed to create post');
      setTitle('');
      setContent('');
      fetchPosts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/posts/${postId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete post');
      fetchPosts();
    } catch (err) {
      alert(err.message);
    }
  };

  const startEditingPost = (post) => {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content || post.body);
  };

  const handleUpdatePost = async (postId, e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/posts/${postId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      if (!res.ok) throw new Error('Failed to update post');
      setEditingPostId(null);
      fetchPosts();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- COMMENT ACTIONS ---
  const handleAddComment = async (postId, e) => {
    e.preventDefault();
    const commentText = commentInputs[postId];
    if (!commentText) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/posts/${postId}/comments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ content: commentText }),
      });
      if (!res.ok) throw new Error('Failed to add comment');
      
      setCommentInputs({ ...commentInputs, [postId]: '' });
      fetchPosts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/comments/${commentId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete comment');
      fetchPosts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateComment = async (commentId, e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/comments/${commentId}/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ content: editCommentText }),
      });
      if (!res.ok) throw new Error('Failed to update comment');
      setEditingCommentId(null);
      fetchPosts();
    } catch (err) {
      alert(err.message);
    }
  };

  // Helper function to safely get author name whether it's a string or object
  const getAuthorName = (authorField) => {
    if (!authorField) return 'Unknown';
    if (typeof authorField === 'object') {
      return authorField.username || authorField.name || JSON.stringify(authorField);
    }
    return authorField;
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Blog Management System</h1>

      {!token ? (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <form 
            onSubmit={isRegistering ? handleRegister : handleLogin} 
            className="card"
            style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '15px' }}
          >
            <h2 style={{ margin: 0, color: '#1f2937' }}>{isRegistering ? 'Register' : 'Login'}</h2>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4b5563' }}>Username:</label>
              <input 
                type="text" 
                value={currentUsername} 
                onChange={(e) => setCurrentUsername(e.target.value)} 
                required
                className="input-field"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#4b5563' }}>Password:</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
                className="input-field"
              />
            </div>
            <button type="submit" className="btn-primary">
              {isRegistering ? 'Sign Up' : 'Log In'}
            </button>
            
            {error && <p style={{ color: '#dc2626', margin: 0, fontSize: '14px' }}>{error}</p>}

            <p style={{ textAlign: 'center', fontSize: '13px', margin: '10px 0 0 0', color: '#6b7280' }}>
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                type="button" 
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
                style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '13px', fontWeight: '600' }}
              >
                {isRegistering ? 'Login here' : 'Register here'}
              </button>
            </p>
          </form>
        </div>
      ) : (
        <div>
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', marginBottom: '20px' }}>
            <span>Logged in as: <strong style={{ color: '#059669' }}>{currentUsername}</strong></span>
            <button onClick={handleLogout} className="btn-danger">
              Log Out
            </button>
          </div>

          <form onSubmit={handleCreatePost} className="card" style={{ marginBottom: '30px' }}>
            <h3 style={{ marginTop: 0, color: '#059669' }}>Create Post</h3>
            <div style={{ marginBottom: '10px' }}>
              <input 
                type="text" 
                placeholder="Title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required
                className="input-field"
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <textarea 
                placeholder="Content" 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                required
                rows="3"
                className="textarea-field"
              />
            </div>
            <button type="submit" className="btn-primary">
              Publish
            </button>
          </form>

          <h2 style={{ color: '#1f2937', marginBottom: '15px' }}>Posts</h2>
          {loading ? (
            <p style={{ color: '#6b7280' }}>Loading...</p>
          ) : posts.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No posts yet.</p>
          ) : (
            posts.map((post) => {
              const authorStr = getAuthorName(post.author_name || post.author);
              const isPostAuthor = authorStr === currentUsername;

              return (
                <div key={post.id} className="card">
                  {editingPostId === post.id ? (
                    <form onSubmit={(e) => handleUpdatePost(post.id, e)} style={{ marginBottom: '15px' }}>
                      <input 
                        type="text" 
                        value={editTitle} 
                        onChange={(e) => setEditTitle(e.target.value)} 
                        required
                        className="input-field"
                        style={{ marginBottom: '10px' }}
                      />
                      <textarea 
                        value={editContent} 
                        onChange={(e) => setEditContent(e.target.value)} 
                        required
                        rows="3"
                        className="textarea-field"
                        style={{ marginBottom: '10px' }}
                      />
                      <button type="submit" className="btn-primary" style={{ marginRight: '10px', padding: '6px 14px' }}>Save</button>
                      <button type="button" onClick={() => setEditingPostId(null)} className="btn-secondary">Cancel</button>
                    </form>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: '0 0 5px 0', color: '#059669', fontSize: '1.25rem' }}>{post.title}</h3>
                          <small style={{ color: '#6b7280' }}>By: {authorStr}</small>
                        </div>
                        {isPostAuthor && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => startEditingPost(post)} className="btn-warning">Edit</button>
                            <button onClick={() => handleDeletePost(post.id)} className="btn-danger">Delete</button>
                          </div>
                        )}
                      </div>
                      <p style={{ margin: '15px 0 10px 0', color: '#4b5563', lineHeight: '1.5' }}>{post.content || post.body}</p>
                    </>
                  )}

                  {/* Comments Section */}
                  <div style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#374151', fontSize: '14px' }}>Comments</h4>
                    {post.comments && post.comments.length > 0 ? (
                      post.comments.map((comment) => {
                        const commentAuthorStr = getAuthorName(comment.author_name || comment.author);
                        const isCommentAuthor = commentAuthorStr === currentUsername;

                        return (
                          <div key={comment.id} className="comment-box" style={{ fontSize: '13px' }}>
                            {editingCommentId === comment.id ? (
                              <form onSubmit={(e) => handleUpdateComment(comment.id, e)}>
                                <input 
                                  type="text" 
                                  value={editCommentText} 
                                  onChange={(e) => setEditCommentText(e.target.value)}
                                  required
                                  className="input-field"
                                  style={{ marginBottom: '6px', padding: '6px 10px' }}
                                />
                                <button type="submit" className="btn-primary" style={{ marginRight: '6px', padding: '4px 10px', fontSize: '11px' }}>Save</button>
                                <button type="button" onClick={() => setEditingCommentId(null)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>Cancel</button>
                              </form>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <span style={{ color: '#059669', fontWeight: 'bold' }}>{commentAuthorStr}: </span>
                                  <span style={{ color: '#4b5563' }}>{comment.content}</span>
                                </div>
                                {isCommentAuthor && (
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.content); }} style={{ background: 'none', border: 'none', color: '#d97706', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Edit</button>
                                    <button onClick={() => handleDeleteComment(comment.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Delete</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ color: '#9ca3af', fontSize: '13px', margin: '5px 0' }}>No comments yet.</p>
                    )}

                    {/* Add Comment Form */}
                    <form onSubmit={(e) => handleAddComment(post.id, e)} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <input 
                        type="text" 
                        placeholder="Write a comment..." 
                        value={commentInputs[post.id] || ''} 
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })} 
                        required
                        className="input-field"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                      />
                      <button type="submit" className="btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>
                        Post
                      </button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default App;