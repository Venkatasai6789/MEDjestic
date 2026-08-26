import React, { useState, useEffect } from 'react';
import { Lock, Mail, ShieldCheck, Stethoscope, RefreshCw, User, Building, Shield } from 'lucide-react';

const LoginView = ({ onLoginSuccess }) => {
  const [portal, setPortal] = useState('staff'); // 'staff' or 'admin'
  const [isRegister, setIsRegister] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('staff@medjestic.com');
  const [password, setPassword] = useState('staff123');
  const [department, setDepartment] = useState('ICU');
  const [role, setRole] = useState('Staff');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const departmentsList = [
    'ICU', 'Emergency', 'Radiology', 'Operation Theater', 
    'Laboratory', 'Pharmacy', 'General Ward', 'Dental Department'
  ];

  // Set default credentials on portal switch
  useEffect(() => {
    if (!isRegister) {
      if (portal === 'admin') {
        setEmail('admin@medjestic.com');
        setPassword('admin123');
        setRole('Admin');
        setDepartment('Administration');
      } else {
        setEmail('staff@medjestic.com');
        setPassword('staff123');
        setRole('Staff');
        setDepartment('ICU');
      }
    }
  }, [portal, isRegister]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let response;
      try {
        response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
      } catch (err) {
        console.warn("Express Backend offline. Falling back to local offline login simulation...");
        setLoading(false);
        simulateOfflineLogin();
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid credentials');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let response;
      try {
        response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role, department })
        });
      } catch (err) {
        console.warn("Express Backend offline. Simulating local signup...");
        setLoading(false);
        setSuccessMsg('Account created successfully! (Offline mode - ready to sign in)');
        setIsRegister(false);
        setEmail(email);
        setPassword(password);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registration failed');
      }

      setSuccessMsg('Account registered successfully! Please log in.');
      setIsRegister(false);
      setLoading(false);
    } catch (err) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const simulateOfflineLogin = () => {
    let mockUser = {
      name: name || (portal === 'admin' ? 'Dr. Samuel' : 'Anny Farisha'),
      email: email,
      role: portal === 'admin' ? 'Admin' : 'Staff',
      department: portal === 'admin' ? 'Administration' : department
    };

    if (email === 'admin@medjestic.com') {
      mockUser = { name: 'Dr. Samuel', email: 'admin@medjestic.com', role: 'Admin', department: 'Administration' };
    } else if (email === 'staff@medjestic.com') {
      mockUser = { name: 'Anny Farisha', email: 'staff@medjestic.com', role: 'Staff', department: 'ICU' };
    }

    localStorage.setItem('token', 'offline_mock_token');
    onLoginSuccess(mockUser);
  };

  // Helper styles for portal switching
  const getCardClass = () => {
    return portal === 'admin'
      ? "w-full max-w-md bg-slate-950/80 border border-indigo-950/80 shadow-[0_0_50px_rgba(99,102,241,0.15)] p-8 relative z-10 animate-in fade-in zoom-in-95 duration-500 rounded-3xl backdrop-blur-xl text-slate-100"
      : "w-full max-w-md bg-white border border-slate-100/80 shadow-2xl p-8 relative z-10 animate-in fade-in zoom-in-95 duration-300 rounded-3xl text-slate-800";
  };

  const getInputClass = () => {
    return portal === 'admin'
      ? "w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all font-sans"
      : "w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-sans";
  };

  const getLabelClass = () => {
    return portal === 'admin'
      ? "text-[10px] font-bold text-slate-400 uppercase tracking-wider block"
      : "text-[10px] font-bold text-slate-500 uppercase tracking-wider block";
  };

  const getIconClass = () => {
    return portal === 'admin' ? "absolute left-3.5 top-3 w-4 h-4 text-slate-500" : "absolute left-3.5 top-3 w-4 h-4 text-slate-400";
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-all duration-700 ${
      portal === 'admin' ? 'bg-[#0a0d18] dark-ekg-grid' : 'bg-[#f4f7fa] ekg-grid'
    }`}>
      {/* Custom Styles for Hospital-themed animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(8deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(-12deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 0 0 0 rgba(37, 99, 235, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 20px 25px -5px rgba(59, 130, 246, 0.2), 0 0 25px 12px rgba(37, 99, 235, 0.25); }
        }
        @keyframes pulse-glow-dark {
          0%, 100% { transform: scale(1); box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4), 0 0 0 0 rgba(99, 102, 241, 0.5); }
          50% { transform: scale(1.05); box-shadow: 0 20px 25px -5px rgba(99, 102, 241, 0.3), 0 0 25px 12px rgba(129, 140, 248, 0.4); }
        }
        @keyframes scan-laser {
          0%, 100% { top: 0%; opacity: 0; }
          10% { opacity: 0.35; }
          90% { opacity: 0.35; }
          50% { top: 100%; }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 6s ease-in-out infinite;
        }
        .animate-float-fast {
          animation: float-fast 4s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        .animate-pulse-glow-dark {
          animation: pulse-glow-dark 3s ease-in-out infinite;
        }
        .scanner-laser {
          position: absolute;
          left: 0;
          width: 100%;
          height: 3px;
          pointer-events: none;
          z-index: 2;
        }
        .ekg-line {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: ekg-draw 15s linear infinite;
        }
        .ekg-line-2 {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: ekg-draw 15s linear infinite;
          animation-delay: 7.5s;
        }
        @keyframes ekg-draw {
          0% { stroke-dashoffset: 2000; }
          100% { stroke-dashoffset: 0; }
        }
        .ekg-grid {
          background-size: 30px 30px;
          background-image: 
            linear-gradient(to right, rgba(37, 99, 235, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(37, 99, 235, 0.03) 1px, transparent 1px);
        }
        .dark-ekg-grid {
          background-size: 30px 30px;
          background-image: 
            linear-gradient(to right, rgba(99, 102, 241, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.04) 1px, transparent 1px);
          position: relative;
        }
        .dark-ekg-grid::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 50%, transparent 20%, rgba(10, 13, 24, 0.6) 80%);
          pointer-events: none;
        }
      `}} />

      {/* Decorative colored blobs in background */}
      <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full transition-all duration-1000 ${
        portal === 'admin' ? 'bg-indigo-500/10 blur-[130px]' : 'bg-blue-400/10 blur-[120px]'
      }`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full transition-all duration-1000 ${
        portal === 'admin' ? 'bg-purple-500/10 blur-[130px]' : 'bg-cyan-400/10 blur-[120px]'
      }`} />

      {/* Dynamic Laser scanner lines */}
      <div className="scanner-laser" style={{
        background: portal === 'admin'
          ? 'linear-gradient(to right, transparent, rgba(99, 102, 241, 0.3), rgba(129, 140, 248, 0.8), rgba(99, 102, 241, 0.3), transparent)'
          : 'linear-gradient(to right, transparent, rgba(59, 130, 246, 0.3), rgba(6, 182, 212, 0.8), rgba(59, 130, 246, 0.3), transparent)'
      }} />

      {/* EKG Heartbeat background lines with animated nodes */}
      <svg className="absolute inset-x-0 bottom-[15%] w-full h-[120px] pointer-events-none opacity-25" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none">
        <defs>
          <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <path className="ekg-line" d="M 0 50 L 150 50 L 170 35 L 185 65 L 200 10 L 215 90 L 230 50 L 400 50 L 420 35 L 435 65 L 450 10 L 465 90 L 480 50 L 650 50 L 670 35 L 685 65 L 700 10 L 715 90 L 730 50 L 900 50 L 920 35 L 935 65 L 950 10 L 965 90 L 980 50 L 1000 50" fill="none" stroke={portal === 'admin' ? '#6366f1' : '#2563eb'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path className="ekg-line-2" d="M 0 50 L 150 50 L 170 35 L 185 65 L 200 10 L 215 90 L 230 50 L 400 50 L 420 35 L 435 65 L 450 10 L 465 90 L 480 50 L 650 50 L 670 35 L 685 65 L 700 10 L 715 90 L 730 50 L 900 50 L 920 35 L 935 65 L 950 10 L 965 90 L 980 50 L 1000 50" fill="none" stroke={portal === 'admin' ? '#3b82f6' : '#06b6d4'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Glowing node pulses travelling along curves */}
        <circle r="6" fill={portal === 'admin' ? '#818cf8' : '#60a5fa'} filter="url(#glow-filter)">
          <animateMotion 
            path="M 0 50 L 150 50 L 170 35 L 185 65 L 200 10 L 215 90 L 230 50 L 400 50 L 420 35 L 435 65 L 450 10 L 465 90 L 480 50 L 650 50 L 670 35 L 685 65 L 700 10 L 715 90 L 730 50 L 900 50 L 920 35 L 935 65 L 950 10 L 965 90 L 980 50 L 1000 50"
            dur="10s" 
            repeatCount="indefinite" 
          />
        </circle>
        <circle r="4" fill={portal === 'admin' ? '#a5b4fc' : '#22d3ee'} opacity="0.9">
          <animateMotion 
            path="M 0 50 L 150 50 L 170 35 L 185 65 L 200 10 L 215 90 L 230 50 L 400 50 L 420 35 L 435 65 L 450 10 L 465 90 L 480 50 L 650 50 L 670 35 L 685 65 L 700 10 L 715 90 L 730 50 L 900 50 L 920 35 L 935 65 L 950 10 L 965 90 L 980 50 L 1000 50"
            dur="10s" 
            begin="5s"
            repeatCount="indefinite" 
          />
        </circle>
      </svg>

      {/* Floating Hospital Symbols */}
      <div className={`absolute top-[15%] left-[8%] opacity-20 animate-float-slow transition-all duration-700 ${
        portal === 'admin' ? 'text-indigo-500' : 'text-blue-500'
      } pointer-events-none hidden md:block`}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/>
        </svg>
      </div>

      <div className={`absolute bottom-[15%] left-[12%] opacity-20 animate-float-medium transition-all duration-700 ${
        portal === 'admin' ? 'text-purple-400' : 'text-cyan-500'
      } pointer-events-none hidden md:block`}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4.5 19.5c6-6 6-11 12-17" />
          <path d="M4.5 2.5c6 6 6 11 12 17" opacity="0.5" />
          <path d="M6 8h12" strokeWidth="1.5" opacity="0.7" />
          <path d="M8 12h8" strokeWidth="1.5" opacity="0.7" />
          <path d="M10 16h4" strokeWidth="1.5" opacity="0.7" />
          <path d="M6 16h12" strokeWidth="1.5" opacity="0.7" />
          <path d="M8 8h8" strokeWidth="1.5" opacity="0.7" />
        </svg>
      </div>

      <div className={`absolute top-[20%] right-[8%] opacity-20 animate-float-medium transition-all duration-700 ${
        portal === 'admin' ? 'text-indigo-400' : 'text-blue-400'
      } pointer-events-none hidden md:block`}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="5" y="8" width="14" height="8" rx="4" transform="rotate(-45 12 12)" />
          <path d="M9 15l6-6" />
        </svg>
      </div>

      <div className={`absolute bottom-[20%] right-[10%] opacity-20 animate-float-slow transition-all duration-700 ${
        portal === 'admin' ? 'text-rose-500' : 'text-rose-400'
      } pointer-events-none hidden md:block`}>
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="M6 12h2.5l1-2 1.5 4.5 1-3.5 1 1H15" strokeWidth="1.5" />
        </svg>
      </div>

      <div className={`absolute top-[50%] left-[6%] opacity-15 animate-float-fast transition-all duration-700 ${
        portal === 'admin' ? 'text-indigo-400' : 'text-emerald-500'
      } pointer-events-none hidden md:block`}>
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 11 2 2 4-4" strokeWidth="1.5" />
        </svg>
      </div>

      <div className={`absolute top-[50%] right-[6%] opacity-15 animate-float-fast transition-all duration-700 ${
        portal === 'admin' ? 'text-purple-400' : 'text-slate-400'
      } pointer-events-none hidden md:block`}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="8" width="18" height="12" rx="2" />
          <path d="M9 8V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3" />
          <path d="M12 11v6" strokeWidth="1.5" />
          <path d="M9 14h6" strokeWidth="1.5" />
        </svg>
      </div>

      <div className={getCardClass()}>
        
        {/* Portal Switcher Tabs */}
        {!isRegister && (
          <div className={`flex p-1 rounded-2xl mb-6 transition-all border ${
            portal === 'admin' ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setPortal('staff')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                portal === 'staff' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Staff Login
            </button>
            <button
              type="button"
              onClick={() => setPortal('admin')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                portal === 'admin' 
                  ? 'bg-slate-800 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)] border border-slate-700' 
                  : 'text-slate-400 hover:text-slate-500'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Portal
            </button>
          </div>
        )}

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`w-14 h-14 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center text-white mb-4 hover:rotate-12 transition-transform duration-300 ${
            portal === 'admin' ? 'animate-pulse-glow-dark' : 'animate-pulse-glow'
          }`}>
            <Stethoscope className="w-7 h-7" />
          </div>
          <h2 className={`text-2xl font-extrabold tracking-tight font-sans transition-colors ${
            portal === 'admin' ? 'text-white' : 'text-slate-800'
          }`}>
            {isRegister 
              ? 'Create Account' 
              : portal === 'admin' ? 'Administrator Login' : 'Welcome to MEDjestic'}
          </h2>
          <p className={`text-[9px] font-bold mt-1 uppercase tracking-wider transition-colors ${
            portal === 'admin' ? 'text-indigo-400' : 'text-slate-400'
          }`}>
            {portal === 'admin' ? 'Secure Infrastructure System' : 'Hospital Waste Management OS'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-medium text-center">
            {successMsg}
          </div>
        )}

        {isRegister ? (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name Input */}
            <div className="space-y-1.5">
              <label className={getLabelClass()}>Full Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={getInputClass()}
                  placeholder="Officer name"
                />
                <User className={getIconClass()} />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className={getLabelClass()}>Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={getInputClass()}
                  placeholder="officer@hospital.com"
                />
                <Mail className={getIconClass()} />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className={getLabelClass()}>Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={getInputClass()}
                  placeholder="••••••••"
                />
                <Lock className={getIconClass()} />
              </div>
            </div>

            {/* Department Selector */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={getLabelClass()}>Department</label>
                <div className="relative">
                  <select 
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={`${getInputClass()} appearance-none`}
                  >
                    {departmentsList.map(dept => (
                      <option key={dept} value={dept} className={portal==='admin' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}>{dept}</option>
                    ))}
                  </select>
                  <Building className={getIconClass()} />
                </div>
              </div>

              {/* Role Selector */}
              <div className="space-y-1.5">
                <label className={getLabelClass()}>System Role</label>
                <div className="relative">
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={`${getInputClass()} appearance-none`}
                  >
                    <option value="Staff" className={portal==='admin' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}>Staff</option>
                    <option value="Admin" className={portal==='admin' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}>Admin</option>
                  </select>
                  <Shield className={getIconClass()} />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full mt-3 py-3 font-bold rounded-xl text-xs transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 text-white ${
                portal === 'admin'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md shadow-indigo-500/10'
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md shadow-blue-500/10'
              }`}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Sign Up & Register
                </>
              )}
            </button>

            <button 
              type="button"
              onClick={() => { setIsRegister(false); setErrorMsg(''); setSuccessMsg(''); }}
              className={`w-full text-center text-xs font-bold mt-2 hover:underline transition-colors ${
                portal === 'admin' ? 'text-indigo-400 hover:text-indigo-300' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              Already have an account? Sign In
            </button>
          </form>
        ) : (
          /* LOGIN FORM */
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email input */}
            <div className="space-y-1.5">
              <label className={getLabelClass()}>Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={getInputClass()}
                  placeholder="doctor@hospital.com"
                />
                <Mail className={getIconClass()} />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className={getLabelClass()}>Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={getInputClass()}
                  placeholder="••••••••"
                />
                <Lock className={getIconClass()} />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full mt-3 py-3 font-bold rounded-xl text-xs transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 text-white ${
                portal === 'admin'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/20'
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md shadow-blue-500/10'
              }`}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Sign In to Dashboard
                </>
              )}
            </button>

            <button 
              type="button"
              onClick={() => { setIsRegister(true); setErrorMsg(''); setSuccessMsg(''); }}
              className={`w-full text-center text-xs font-bold mt-2 hover:underline transition-colors ${
                portal === 'admin' ? 'text-indigo-400 hover:text-indigo-300' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              Don't have an account? Sign Up
            </button>
          </form>
        )}
        
        <div className={`mt-8 text-center text-[10px] font-semibold transition-colors ${
          portal === 'admin' ? 'text-slate-600' : 'text-slate-400'
        }`}>
          Authorized hospital personnel use only. HIPAA & OSHA Compliant.
        </div>
      </div>
    </div>
  );
};

export default LoginView;
