import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import Dashboard from './components/Dashboard';
import './Login.css';

type Page = 'login' | 'signup' | 'dashboard';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Load user session on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      setCurrentUser(savedUser);
      setCurrentPage('dashboard');
    }
  }, []);

  // ล้างข้อผิดพลาดเมื่อเปลี่ยนหน้า
  useEffect(() => {
    setError('');
  }, [currentPage]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- ระบบจำลอง (LocalStorage) ---
    const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (user) {
      const userName = user.name || user.email;
      setCurrentUser(userName);
      localStorage.setItem('current_user', userName); // Save session
      setCurrentPage('dashboard');
    } else {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- ระบบจำลอง (LocalStorage) ---
    const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
    
    if (users.find((u: any) => u.email === email)) {
      setError('มีผู้ใช้งานอีเมลนี้อยู่ในระบบแล้ว');
      return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    localStorage.setItem('mock_users', JSON.stringify(users));
    
    alert('ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ');
    setCurrentPage('login');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('current_user'); // Clear session
    setCurrentPage('login');
    setEmail('');
    setPassword('');
  };

  if (currentPage === 'dashboard' && currentUser) {
    return <Dashboard user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-mascot">
          <img src="/images/images.jfif" alt="Mascot" />
        </div>
        <div className="login-header">
          <h1>{currentPage === 'login' ? 'ยินดีต้อนรับกลับมา' : 'สร้างบัญชีใหม่'}</h1>
          <p>{currentPage === 'login' ? 'กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ' : 'กรอกรายละเอียดด้านล่างเพื่อเริ่มต้นใช้งาน'}</p>
        </div>

        {error && <div style={{ color: '#ff4d4d', fontSize: '14px', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={currentPage === 'login' ? handleLogin : handleSignUp} className="login-form">
          {currentPage === 'signup' && (
            <div className="input-group">
              <label htmlFor="name">ชื่อ-นามสกุล</label>
              <div className="input-wrapper">
                <User className="input-icon" size={20} />
                <input
                  type="text"
                  id="name"
                  placeholder="เช่น สมชาย ใจดี"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">อีเมล</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                id="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">รหัสผ่าน</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {currentPage === 'login' && (
            <div className="form-actions">
              <label className="checkbox-container">
                <input type="checkbox" />
                <span className="checkmark"></span>
                จดจำฉัน
              </label>
              <a href="#" className="forgot-password">ลืมรหัสผ่าน?</a>
            </div>
          )}

          <button type="submit" className="login-button">
            {currentPage === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกตอนนี้'}
          </button>
        </form>

        <p className="signup-link">
          {currentPage === 'login' ? (
            <>ยังไม่มีบัญชีใช่ไหม? <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('signup'); }}>สมัครสมาชิก</a></>
          ) : (
            <>มีบัญชีอยู่แล้วใช่ไหม? <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('login'); }}>เข้าสู่ระบบ</a></>
          )}
        </p>
      </div>
    </div>
  );
};

export default App;
