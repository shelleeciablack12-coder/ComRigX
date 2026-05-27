import React, { useState } from 'react';
import './Auth.css';

/**
 * Authentication component for login and signup
 */
export default function Auth({ onAuthSuccess, backendUrl }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handlePhoneChange = (e) => {
    setPhoneNumber(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handleDisplayNameChange = (e) => {
    setDisplayName(e.target.value);
  };

  const validatePhoneNumber = (phone) => {
    const cleaned = phone.replace(/[\s\-().+]/g, '');
    return /^\d{10,}$/.test(cleaned);
  };

  const validateUsername = (user) => {
    return /^[a-zA-Z][a-zA-Z0-9_]{2,29}$/.test(user);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber || !password) {
      setError('Please enter phone number and password');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store session in localStorage
      localStorage.setItem('sessionToken', data.sessionToken);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', data.username);
      localStorage.setItem('displayName', data.displayName);

      onAuthSuccess({
        userId: data.userId,
        username: data.username,
        displayName: data.displayName,
        sessionToken: data.sessionToken
      });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber || !username || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    if (!validateUsername(username)) {
      setError('Username must be 3-30 characters, start with a letter, and contain only letters, numbers, and underscores');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber,
          username,
          password,
          displayName: displayName || username
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Store session in localStorage
      localStorage.setItem('sessionToken', data.sessionToken);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', data.username);
      localStorage.setItem('displayName', data.displayName);

      onAuthSuccess({
        userId: data.userId,
        username: data.username,
        displayName: data.displayName,
        sessionToken: data.sessionToken
      });
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    if (mode === 'login') {
      handleLogin(e);
    } else {
      handleSignup(e);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">ComRigX</h1>
        <p className="auth-subtitle">Secure Messaging</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Phone Number */}
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="Enter phone number (e.g., +1 (555) 123-4567)"
              disabled={loading}
              className="form-input"
            />
          </div>

          {/* Signup only fields */}
          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="3-30 characters (letters, numbers, underscore)"
                  disabled={loading}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="displayName">Display Name (optional)</label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={handleDisplayNameChange}
                  placeholder="How you want to appear in chats"
                  disabled={loading}
                  className="form-input"
                />
              </div>
            </>
          )}

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder={mode === 'login' ? 'Enter your password' : 'At least 6 characters'}
                disabled={loading}
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && <div className="auth-error">{error}</div>}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>

          {/* Mode toggle */}
          <div className="auth-toggle">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className="toggle-link"
                  disabled={loading}
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="toggle-link"
                  disabled={loading}
                >
                  Login
                </button>
              </p>
            )}
          </div>
        </form>

        <div className="auth-info">
          <h3>🔒 Privacy First</h3>
          <ul>
            <li>Your phone number is private and never shared</li>
            <li>Use your unique username to be found</li>
            <li>Control who can see your phone number</li>
            <li>Every message is encrypted</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
