import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { styles } from '../styles';
import { logo } from '../assets';

const Blog = () => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [blogPosts, setBlogPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/posts`
        );
        if (!res.ok) throw new Error('Failed to fetch posts');
        const data = await res.json();
        setBlogPosts(data);
      } catch (err) {
        console.error('Error fetching posts, falling back to defaults:', err);
        const savedPosts = localStorage.getItem('blogPosts');
        if (savedPosts) setBlogPosts(JSON.parse(savedPosts));
        else setBlogPosts(getDefaultPosts());
      }
    };

    fetchPosts();
  }, []);

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
        "Three.js is a JavaScript library that makes 3D web development accessible. Learn how to create 3D scenes, add lighting, textures, and animations. This guide will help you understand the basics of WebGL and how to build immersive web experiences.",
      author: 'Kelechukwu Eze',
    },
    {
      id: 4,
      title: 'Node.js Backend Development',
      date: 'Oct 28, 2025',
      category: 'Backend',
      excerpt: 'Build robust and scalable server-side applications with Node.js.',
      content:
        "Node.js allows you to use JavaScript on the server side. In this comprehensive guide, we'll explore Express.js, middleware, routing, and connecting to databases. Learn best practices for building secure and efficient backend applications.",
      author: 'Kelechukwu Eze',
    },
    {
      id: 5,
      title: 'MongoDB: NoSQL Database Essentials',
      date: 'Oct 20, 2025',
      category: 'Database',
      excerpt: 'Understand how to work with MongoDB for flexible data storage.',
      content:
        "MongoDB is a popular NoSQL database that stores data in flexible JSON-like documents. This article covers collections, documents, CRUD operations, and indexing. You'll learn when to use MongoDB and how to optimize your queries.",
      author: 'Kelechukwu Eze',
    },
    {
      id: 6,
      title: 'Docker Containerization Guide',
      date: 'Oct 12, 2025',
      category: 'DevOps',
      excerpt: 'Simplify deployment with Docker containers and streamline your workflow.',
      content:
        "Docker allows you to package applications and their dependencies into containers. Learn how to create Dockerfile, build images, run containers, and use Docker Compose for multi-container applications. Discover how Docker improves consistency across environments.",
      author: 'Kelechukwu Eze',
    },
  ];

  const categories = ['All', 'React', 'CSS', '3D Graphics', 'Backend', 'Database', 'DevOps'];
  const filteredPosts = selectedCategory === 'All' ? blogPosts : blogPosts.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-primary">
      <header className="fixed top-0 left-0 w-full bg-primary/80 backdrop-blur-md z-50">
        <div className={`${styles.paddingX} max-w-7xl mx-auto h-16 flex items-center justify-between`}>
          <Link
            to="/"
            className="flex items-center gap-2"
            onClick={() => window.scrollTo(0, 0)}
          >
            <img src={logo} alt="logo" className="w-9 h-9 object-contain" />
            <p className="text-white text-[18px] font-bold cursor-pointer flex">
              Kelechukwu&nbsp;
              <span className="sm:block hidden"> | Portfolio</span>
            </p>
          </Link>
          <a
            href="/blog/admin"
            className="text-secondary hover:text-white text-[16px] font-medium transition"
            aria-label="Admin login"
          >
            Admin Login
          </a>
        </div>
      </header>

      <div className="h-16" />

      <div className="w-full pt-28 pb-10 bg-hero-pattern bg-cover bg-no-repeat bg-center">
        <div className={`${styles.paddingX} max-w-7xl mx-auto mt-8`}>
          <h1 className={`${styles.heroHeadText} text-white`}>Blog</h1>
          <p className={`${styles.sectionSubText} mt-2`}>Insights, tutorials, and stories about web development</p>
        </div>
      </div>

      <div className={`${styles.paddingX} max-w-7xl mx-auto py-16`}>
        <div className="mb-12">
          <p className="text-secondary text-[18px] font-medium mb-6">Filter by Category</p>
          <div className="flex flex-wrap gap-4">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setSelectedCategory(c);
                  setSelectedPost(null);
                }}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  selectedCategory === c ? 'bg-tertiary text-white' : 'bg-black-100 text-secondary hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {selectedPost ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <button onClick={() => setSelectedPost(null)} className="text-secondary hover:text-white text-[18px] font-medium mb-8 transition">
              ← Back to All Posts
            </button>
            <div className="bg-black-100 p-8 rounded-2xl">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-bold text-green-500 uppercase tracking-wider">{selectedPost.category}</span>
                <p className="text-secondary text-[14px]">{selectedPost.date}</p>
              </div>
              <h1 className={`${styles.sectionHeadText} text-white mb-4`}>{selectedPost.title}</h1>
              <p className="text-secondary text-[16px] mb-8">By {selectedPost.author}</p>
              <div className="text-white text-[18px] leading-8 whitespace-pre-wrap">{selectedPost.content}</div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} onClick={() => setSelectedPost(post)} className="bg-black-100 p-6 rounded-2xl hover:bg-black-200 cursor-pointer transition transform hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-green-500 uppercase tracking-wider">{post.category}</span>
                  <p className="text-secondary text-[12px]">{post.date}</p>
                </div>
                <h3 className="text-white text-[20px] font-bold mb-3">{post.title}</h3>
                <p className="text-secondary text-[14px] mb-4 line-clamp-3">{post.excerpt}</p>
                <button className="text-green-500 hover:text-white transition text-[14px] font-medium">Read More →</button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {filteredPosts.length === 0 && !selectedPost && (
          <div className="text-center py-16">
            <p className="text-secondary text-[18px]">No posts found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
