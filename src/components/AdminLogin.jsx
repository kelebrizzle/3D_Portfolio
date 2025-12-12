import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { styles } from '../styles';
import { logo } from '../assets';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'https://threed-portfolio-nakj.onrender.com'}/api/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login failed');
        setLoading(false);
        return;
      }

      // store token
      localStorage.setItem('authToken', data.token);
      setLoading(false);
      navigate('/blog/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again later.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* Logo Header */}
      <header className="fixed top-0 left-0 w-full bg-primary/80 backdrop-blur-md z-50">
        <div className={`${styles.paddingX} max-w-7xl mx-auto h-16 flex items-center`}>
          <Link to="/" className="flex items-center gap-2" onClick={() => window.scrollTo(0, 0)}>
            <img src={logo} alt="logo" className="w-9 h-9 object-contain" />
            <p className="text-white text-[18px] font-bold cursor-pointer flex">
              Kelechukwu&nbsp;
              <span className="sm:block hidden"> | Portfolio</span>
            </p>
          </Link>
        </div>
      </header>

      {/* Login Form Container */}
      <div className="flex-1 flex items-center justify-center pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${styles.paddingX} w-full max-w-sm bg-black-100 p-8 rounded-2xl`}
        >
          <h1 className={`${styles.sectionHeadText} text-white mb-2`}>Login</h1>
          <p className="text-secondary text-[16px] mb-8">Enter login details</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div>
              <label className="text-white font-medium mb-2 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-tertiary py-3 px-4 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium"
                required
              />
            </div>

            <div>
              <label className="text-white font-medium mb-2 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-tertiary py-3 px-4 placeholder:text-secondary text-white rounded-lg outline-none border-none font-medium"
                required
              />
            </div>

            {error && (
              <div className="bg-red-600 bg-opacity-20 border border-red-600 text-red-400 px-4 py-2 rounded-lg text-[14px]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-tertiary py-3 px-8 rounded-xl outline-none w-full text-white font-bold shadow-md shadow-primary hover:bg-opacity-80 transition disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;
