import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!login(email, password)) {
      setError('Invalid email or password');
    }
  };

  const quickLogin = (email, password) => {
    setEmail(email);
    setPassword(password);
    login(email, password);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo">S</div>
          <span className="brand">SIRIAN</span>
        </div>
        <p className="login-subtitle">Intelligent Logistics Management</p>
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@sirian.co" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="login-btn">Sign In</button>
        </form>
        <div className="login-hint">
          <strong>Quick Login (Demo):</strong><br/>
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginTop:'8px'}}>
            <button className="btn btn-sm btn-secondary" onClick={() => quickLogin('admin@sirian.co','admin123')}>Admin</button>
            <button className="btn btn-sm btn-secondary" onClick={() => quickLogin('linda@sirian.co','finance123')}>Finance</button>
            <button className="btn btn-sm btn-secondary" onClick={() => quickLogin('oscar@sirian.co','ops123')}>Operations</button>
            <button className="btn btn-sm btn-secondary" onClick={() => quickLogin('james@sirian.co','admin123')}>Driver</button>
          </div>
        </div>
      </div>
    </div>
  );
}
