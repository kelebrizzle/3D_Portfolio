import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { styles } from '../styles';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    category: '',
    excerpt: '',
    content: '',
    author: 'Kelechukwu Eze',
  });

  const categories = ['React', 'CSS', '3D Graphics', 'Backend', 'Database', 'DevOps', 'Other'];

  // Check admin auth
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/blog/admin');
      return;
    }

    // Fetch posts from backend
    const fetchPosts = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/posts`
        );
        if (!res.ok) throw new Error('Failed to fetch posts');
        const data = await res.json();
        setPosts(data);
      } catch (err) {
        console.error('Error fetching posts:', err);
        // fallback to defaults
        setPosts(getDefaultPosts());
      }
    };

    fetchPosts();
  }, [navigate]);

  const getDefaultPosts = () => [
    {
      id: 1,
      title: 'Getting Started with React',
      date: 'Nov 15, 2025',
      category: 'React',
      excerpt: 'Learn the fundamentals of React and how to build your first component.',
      content:
        "React is a powerful JavaScript library for building user interfaces with reusable components. In this guide, we'll explore the basics of React, including components, state, props, and hooks. You'll learn how to create dynamic and interactive web applications efficiently.",
      author: 'Kelechukwu Eze',
    },
    {
      id: 2,
      title: 'Mastering Tailwind CSS',
      date: 'Nov 10, 2025',
      category: 'CSS',
      excerpt: 'Discover utility-first CSS with Tailwind and build beautiful UIs faster.',
      content:
        "Tailwind CSS is a utility-first CSS framework that helps you build modern designs without leaving your HTML. This article covers how to leverage Tailwind's powerful features, customize your theme, and create responsive designs that look great on all devices.",
      author: 'Kelechukwu Eze',
    },
    {
      id: 3,
      title: '3D Web Development with Three.js',
      date: 'Nov 5, 2025',
      category: '3D Graphics',
      excerpt: 'Bring your web projects to life with stunning 3D graphics.',
      content:
        'Three.js is a JavaScript library that makes 3D web development accessible. Learn how to create 3D scenes, add lighting, textures, and animations. This guide will help you understand the basics of WebGL and how to build immersive web experiences.',
      author: 'Kelechukwu Eze',
    },
  ];

  // Helper to refresh posts from backend
  const refreshPosts = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/posts`
      );
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error('refreshPosts error:', err);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle create/update
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.category || !formData.excerpt || !formData.content) {
      alert('Please fill in all fields');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/blog/admin');
      return;
    }

    try {
      if (isEditing) {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/posts/${editingId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
          }
        );
        if (!res.ok) throw new Error('Update failed');
        await refreshPosts();
        setIsEditing(false);
        setEditingId(null);
      } else {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/posts`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
          }
        );
        if (!res.ok) throw new Error('Create failed');
        await refreshPosts();
      }

      setFormData({
        title: '',
        date: '',
        category: '',
        excerpt: '',
        content: '',
        author: 'Kelechukwu Eze',
      });
    } catch (err) {
      console.error('Submit error:', err);
      alert(err.message || 'Failed to save post');
    }
  };

  // Handle edit
  const handleEdit = (post) => {
    setFormData(post);
    setEditingId(post.id);
    setIsEditing(true);
    window.scrollTo(0, 0);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/blog/admin');
      return;
    }
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/posts/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error('Delete failed');
      await refreshPosts();
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.message || 'Failed to delete post');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/blog');
  };

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <div className="w-full fixed top-0 z-50 bg-black-100 border-b border-tertiary">
        <div
          className={`${styles.paddingX} max-w-7xl mx-auto flex justify-between items-center py-5`}
        >
          <h1 className="text-white text-[24px] font-bold">Admin Dashboard</h1>
          <div className="flex gap-4">
            <a
              href="/blog"
              className="text-secondary hover:text-white text-[16px] font-medium transition"
            >
              View Blog
            </a>
            <button
              onClick={handleLogout}
              className="text-secondary hover:text-white text-[16px] font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className={`${styles.paddingX} max-w-7xl mx-auto pt-24 pb-16`}>
        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black-100 p-8 rounded-2xl mb-12"
        >
          <h2 className={`${styles.sectionHeadText} text-white mb-8`}>
            {isEditing ? 'Edit Post' : 'Create New Post'}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-white font-medium mb-2 block">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Post title"
                  className="w-full bg-tertiary py-3 px-4 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium"
                />
              </div>

              <div>
                <label className="text-white font-medium mb-2 block">Date</label>
                <input
                  type="text"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  placeholder="Nov 23, 2025"
                  className="w-full bg-tertiary py-3 px-4 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium"
                />
              </div>

              <div>
                <label className="text-white font-medium mb-2 block">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-tertiary py-3 px-4 text-white rounded-lg outline-none border-none font-medium"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-white font-medium mb-2 block">Author</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="Author name"
                  className="w-full bg-tertiary py-3 px-4 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-white font-medium mb-2 block">Excerpt *</label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                placeholder="Brief summary of the post"
                rows={2}
                className="w-full bg-tertiary py-3 px-4 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium"
              />
            </div>

            <div>
              <label className="text-white font-medium mb-2 block">Content *</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Full post content"
                rows={8}
                className="w-full bg-tertiary py-3 px-4 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-tertiary py-3 px-8 rounded-xl outline-none text-white font-bold shadow-md shadow-primary hover:bg-opacity-80 transition"
              >
                {isEditing ? 'Update Post' : 'Create Post'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingId(null);
                    setFormData({
                      title: '',
                      date: '',
                      category: '',
                      excerpt: '',
                      content: '',
                      author: 'Kelechukwu Eze',
                    });
                  }}
                  className="bg-black-200 py-3 px-8 rounded-xl outline-none text-white font-bold border border-tertiary hover:bg-opacity-80 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </motion.div>

        {/* Posts List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className={`${styles.sectionHeadText} text-white mb-8`}>Posts ({posts.length})</h2>

          {posts.length === 0 ? (
            <div className="bg-black-100 p-8 rounded-2xl text-center">
              <p className="text-secondary text-[18px]">
                No posts yet. Create your first post above!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-black-100 p-6 rounded-2xl border border-tertiary border-opacity-30 hover:border-opacity-100 transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold text-green-500 uppercase tracking-wider">
                          {post.category}
                        </span>
                        <p className="text-secondary text-[14px]">{post.date}</p>
                      </div>
                      <h3 className="text-white text-[20px] font-bold">{post.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(post)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[14px] font-medium transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-[14px] font-medium transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-secondary text-[14px] line-clamp-2">{post.excerpt}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
