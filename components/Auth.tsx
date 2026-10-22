
import React, { useState, useEffect } from 'react';
import { Lock, User, UserPlus, ShieldCheck, AlertCircle, LayoutDashboard } from 'lucide-react';

interface Props {
  onLogin: (username: string) => void;
}

const Auth: React.FC<Props> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [hasAdmin, setHasAdmin] = useState(false);

  useEffect(() => {
    const admin = localStorage.getItem('classguard_admin');
    setHasAdmin(!!admin);
    if (!admin) setIsRegistering(true);
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      if (!username || !password) return setError("All fields are required.");
      if (password !== confirmPassword) return setError("Passwords do not match.");
      
      localStorage.setItem('classguard_admin', JSON.stringify({ username, password }));
      alert("Admin Registered Successfully! Please login.");
      setIsRegistering(false);
      setHasAdmin(true);
      setPassword('');
    } else {
      const stored = localStorage.getItem('classguard_admin');
      if (stored) {
        const { username: sUser, password: sPass } = JSON.parse(stored);
        if (username === sUser && password === sPass) {
          onLogin(username);
        } else {
          setError("Invalid credentials.");
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-900 relative overflow-hidden px-4">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-10"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyber-500/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 bg-cyber-500 rounded-2xl items-center justify-center shadow-neon transform rotate-3 mb-4">
                <ShieldCheck className="w-10 h-10 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tighter font-mono uppercase">
                ClassGuard <span className="text-cyber-500">Gatekeeper</span>
            </h1>
            <p className="text-cyber-400 text-xs uppercase tracking-[0.2em] mt-2 font-mono">Restricted Access Area</p>
        </div>

        <div className="bg-cyber-800/80 backdrop-blur-xl border border-cyber-700 p-8 rounded-3xl shadow-2xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-cyber-500 rounded-b-full shadow-neon"></div>
            
            <form onSubmit={handleAuth} className="space-y-5">
                <div>
                    <label className="block text-xs font-mono text-cyber-500 uppercase mb-2 tracking-widest">Operator Identity</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-600" />
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            className="w-full bg-cyber-900 border border-cyber-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-cyber-500 focus:ring-1 focus:ring-cyber-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-mono text-cyber-500 uppercase mb-2 tracking-widest">Security Clearance (Password)</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-600" />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-cyber-900 border border-cyber-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-cyber-500 focus:ring-1 focus:ring-cyber-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {isRegistering && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-mono text-cyber-500 uppercase mb-2 tracking-widest">Verify Clearance</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-600" />
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-cyber-900 border border-cyber-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-cyber-500 focus:ring-1 focus:ring-cyber-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 text-red-400 text-xs bg-red-900/20 p-3 rounded-lg border border-red-900/50 animate-bounce">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}

                <button 
                    type="submit"
                    className="w-full py-4 bg-cyber-500 text-black font-bold rounded-xl shadow-neon hover:bg-cyber-400 transform hover:scale-[1.02] transition-all font-mono uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    {isRegistering ? <UserPlus className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    {isRegistering ? "Initialize System" : "Authorize Access"}
                </button>
            </form>

            <div className="mt-8 text-center">
                <button 
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-cyber-500 hover:text-cyber-300 text-xs uppercase font-mono tracking-widest underline decoration-cyber-700 underline-offset-4"
                >
                    {isRegistering ? "Existing Operator? Login" : "First Time? Register Admin"}
                </button>
            </div>
        </div>
        
        <p className="mt-8 text-center text-cyber-600 text-[10px] uppercase tracking-[0.3em]">
            Secured by AK AI Biometrics Protocol
        </p>
      </div>
    </div>
  );
};

export default Auth;
