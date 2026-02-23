import React, { useState, useRef } from 'react';
import { FiUser, FiLock, FiAlertCircle, FiShield } from 'react-icons/fi';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const { login, loginWithGoogle, isLoading, error: authError } = useAuth();
    const portalBaseUrl = (process.env.REACT_APP_PORTAL_BASE_URL || '').replace(/\/+$/, '');

    // Custom Google Login Hook
    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                await loginWithGoogle(tokenResponse.access_token, true);
            } catch (err: any) {
                console.error('Google login failed', err);
                setLocalError(err.message || 'Google Sign-In failed');
            }
        },
        onError: () => {
            setLocalError('Google Sign-In failed');
        },
    });

    // Horizontal Scroll & Drag Logic
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
        setScrollLeft(scrollRef.current?.scrollLeft || 0);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
        const walk = (x - startX) * 2;
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollLeft - walk;
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft += e.deltaY;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (!userName || !password) {
            setLocalError('Please enter your credentials');
            return;
        }

        try {
            await login(userName, password);
        } catch (err: any) {
            console.error('Authentication error:', err);
        }
    };

    const handleSignUpRedirect = () => {
        if (!portalBaseUrl) {
            setLocalError('Missing REACT_APP_PORTAL_BASE_URL configuration.');
            return;
        }
        window.location.href = `${portalBaseUrl}/login`;
    };

    const handleForgotPasswordRedirect = () => {
        if (!portalBaseUrl) {
            setLocalError('Missing REACT_APP_PORTAL_BASE_URL configuration.');
            return;
        }
        window.location.href = `${portalBaseUrl}/forgotpassword`;
    };

    return (
        <div className="min-h-screen bg-white flex overflow-auto font-sans antialiased text-neutral-text-main relative">
            {/* Left Side: Form Container */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12 xl:p-14 z-10 bg-white relative">
                {/* Subtle Decorative Aura from Right Side */}
                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#0052cc]/5 to-transparent pointer-events-none"></div>

                <div className="w-full max-w-[380px] flex flex-col items-center text-center relative z-20">
                    {/* Branding - Refined */}
                    <div className="mb-10 flex flex-col items-center">
                        <div className="inline-flex items-center justify-center mb-10 p-4 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-border/30 transform hover:scale-105 transition-transform duration-500">
                            <img
                                src="https://framerusercontent.com/images/rxRzehsbTWOIxWQ9b0ytKSM1ZjY.png?scale-down-to=512"
                                alt="Logo"
                                className="h-10 w-auto object-contain"
                            />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-neutral-text-main">Admin Portal</h1>
                        <p className="text-base font-semibold text-primary-main/60 mt-3 tracking-wide">
                            Secured Intelligence Interface
                        </p>
                    </div>

                    {/* Login Container */}
                    <div className="space-y-8 w-full">
                        {(localError || authError) && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-status-error flex items-center gap-3 animate-slide-in-right">
                                <FiAlertCircle className="shrink-0" size={18} />
                                <span className="text-sm font-semibold">{localError || authError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8 text-left">
                            {/* Google Sign-In (Primary) - Custom Fancy Button */}
                            <div className="flex justify-center w-full">
                                <button
                                    type="button"
                                    onClick={() => googleLogin()}
                                    className="relative w-full py-4 px-6 flex items-center justify-center gap-4 bg-white border border-neutral-border hover:border-[#0052cc]/30 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_24px_rgba(0,82,204,0.1)] hover:-translate-y-0.5 transition-all duration-300 group"
                                >
                                    {/* Google G Icon */}
                                    <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.09.56 4.23 1.65l3.18-3.18C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    <span className="text-sm font-bold text-neutral-text-main group-hover:text-[#0052cc] transition-colors">Sign in with Google</span>
                                </button>
                            </div>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">OR LOGIN WITH EMAIL</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-extrabold text-neutral-text-muted uppercase tracking-[0.2em] ml-1">Username</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-text-muted/40 group-focus-within:text-[#0052cc] transition-colors duration-500">
                                        <FiUser size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        className="block w-full pl-12 pr-4 py-4 bg-[#f9fafb] border border-neutral-border/40 rounded-2xl text-sm font-medium transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-[#0052cc]/5 focus:border-[#0052cc]/60 focus:bg-white placeholder:text-neutral-text-muted/20"
                                        placeholder="Enter username"
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] font-extrabold text-neutral-text-muted uppercase tracking-[0.2em]">Password</label>
                                    <button
                                        type="button"
                                        onClick={handleForgotPasswordRedirect}
                                        className="text-[10px] font-bold text-[#0052cc] hover:text-[#0747a6] transition-colors uppercase tracking-[0.1em] opacity-70 hover:opacity-100"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-text-muted/40 group-focus-within:text-[#0052cc] transition-colors duration-500">
                                        <FiLock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-12 pr-4 py-4 bg-[#f9fafb] border border-neutral-border/40 rounded-2xl text-sm font-medium transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-[#0052cc]/5 focus:border-[#0052cc]/60 focus:bg-white placeholder:text-neutral-text-muted/20"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`group relative w-full py-4 px-6 rounded-2xl text-white text-sm font-bold transition-all duration-500 active:scale-[0.97] overflow-hidden ${isLoading
                                    ? 'bg-neutral-text-muted cursor-not-allowed'
                                    : 'bg-black shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] hover:shadow-[0_25px_50px_-12px_rgba(0,82,204,0.3)]'
                                    }`}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2 tracking-[0.1em] uppercase text-sm font-bold">
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Authorizing...
                                        </>
                                    ) : (
                                        'Sign in to Console'
                                    )}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-[#0052cc] to-[#0747a6] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            </button>
                        </form>
                    </div>

                    {/* Legal - Refined */}
                    <div className="mt-12 w-full opacity-40 group cursor-default">
                        <div className="flex flex-col gap-2 border-t border-neutral-border/30 pt-8 items-center">
                            <p className="text-[10px] font-extrabold text-neutral-text-muted uppercase tracking-[0.2em]">
                                &copy; 2017-2026 All Rights Reserved.
                            </p>
                            <p className="text-[9px] font-bold text-neutral-text-muted/60 uppercase tracking-widest">
                                altolabs.ai&reg; is a registered trademark of Altolabs AI
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Immersive Visual Panel with Products */}
            <div className="hidden md:flex md:flex-[1.2] lg:flex-[1.5] relative bg-[#0a0a0a] overflow-hidden flex-col">
                {/* Visual Background - Deeper Grain & Better Blend */}
                <div className="absolute inset-0 z-0 bg-[#050505]">
                    <div className="absolute inset-0 opacity-[0.15] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

                    {/* Better Blending Aura near the divider */}
                    <div className="absolute -left-40 top-0 w-80 h-full bg-gradient-to-r from-black/80 to-transparent z-10"></div>

                    <div className="absolute top-1/4 -right-20 w-[700px] h-[700px] bg-[#0052cc]/15 blur-[140px] rounded-full animate-pulse"></div>
                    <div className="absolute -bottom-20 -left-20 w-[600px] h-[600px] bg-indigo-900/10 blur-[120px] rounded-full animate-pulse delay-700"></div>
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 flex flex-col h-full p-12 lg:p-16 text-white overflow-y-auto scrollbar-hide">
                    <div className="max-w-4xl space-y-12">
                        {/* Header Section */}
                        <div className="flex flex-col gap-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full w-fit group cursor-default">
                                <span className="text-[#0052cc] text-xs font-black animate-pulse">+</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/50 group-hover:text-white transition-colors duration-500">Technology Systems</span>
                            </div>
                            <h3 className="text-6xl font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
                                Platforms &<br />Products
                            </h3>
                        </div>

                        {/* Product Cards Carousel - Horizontal Scroll */}
                        <div
                            ref={scrollRef}
                            onMouseDown={handleMouseDown}
                            onMouseLeave={handleMouseLeave}
                            onMouseUp={handleMouseUp}
                            onMouseMove={handleMouseMove}
                            onWheel={handleWheel}
                            className={`flex gap-10 pb-28 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-8 px-8 lg:mx-0 lg:px-0 select-none cursor-grab active:cursor-grabbing transition-all duration-700 ease-in-out`}
                            style={{
                                scrollBehavior: 'smooth',
                            }}
                        >
                            {[
                                {
                                    name: 'Prism',
                                    subtitle: 'Autonomous AI Platform',
                                    desc: 'Building, training, and managing autonomous agents with full enterprise observability and security.',
                                    bullets: ['Agent Orchestration', 'Adaptive Studio', 'Self-Healing Nodes', 'Secure Data Ingestion'],
                                    color: 'from-blue-600/20 to-blue-900/40',
                                    iconColor: 'bg-blue-500',
                                    image: 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?auto=format&fit=crop&q=80&w=1000'
                                },
                                {
                                    name: 'Inferno',
                                    subtitle: 'Sovereign Engine',
                                    desc: 'Purpose-built for large enterprises requiring local data residency and sovereign control over AI execution.',
                                    bullets: ['Sovereign Enclave', 'Hybrid Deployment', 'Zero-Trust Protocol', 'Model Portability'],
                                    color: 'from-red-600/20 to-red-900/40',
                                    iconColor: 'bg-red-500',
                                    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000'
                                },
                                {
                                    name: 'Tango',
                                    subtitle: 'Voice Intelligence',
                                    desc: 'Real-time agentic voice experiences with emotional intelligence and contextual memory for customer journeys.',
                                    bullets: ['Semantic Audio Pipe', 'Contextual Memory', 'Multi-Modal Voice', 'Journey Mapping'],
                                    color: 'from-emerald-600/20 to-emerald-900/40',
                                    iconColor: 'bg-emerald-500',
                                    image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=1000'
                                },
                                {
                                    name: 'Gloss',
                                    subtitle: 'Document Intelligence',
                                    desc: 'Transforming unstructured knowledge into actionable insights with enterprise-grade RAG and vector indexing.',
                                    bullets: ['Advanced RAG', 'Vector Indexing', 'Compliance Audit', 'Auto-Summarization'],
                                    color: 'from-amber-600/20 to-amber-900/40',
                                    iconColor: 'bg-amber-500',
                                    image: 'https://images.unsplash.com/photo-1639322537504-6427a16b0a28?auto=format&fit=crop&q=80&w=1000'
                                },
                                {
                                    name: 'Sentinel',
                                    subtitle: 'Workforce Ops',
                                    desc: 'An always-on operational IT workforce proactively detecting failures and orchestrating fixes across endpoints.',
                                    bullets: ['AI Operations', 'Fleet Management', 'Proactive Healing', 'Ecosystem Connect'],
                                    color: 'from-purple-600/20 to-purple-900/40',
                                    iconColor: 'bg-purple-500',
                                    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=1000'
                                },
                                {
                                    name: 'Pulse',
                                    subtitle: 'Excellence Hub',
                                    desc: 'Measuring and accelerating AI adoption through governed frameworks and human-in-the-loop workflows.',
                                    bullets: ['Adoption Tracking', 'Governed Framework', 'Workflow Insights', 'HIL Integration'],
                                    color: 'from-cyan-600/20 to-cyan-900/40',
                                    iconColor: 'bg-cyan-500',
                                    image: 'https://images.unsplash.com/photo-1614850523296-e8c041de4398?auto=format&fit=crop&q=80&w=1000'
                                }
                            ].map((product, idx) => (
                                <div key={idx} className="flex-shrink-0 w-[440px] snap-center group flex flex-col gap-6 p-8 bg-neutral-900/60 border border-white/5 rounded-[40px] backdrop-blur-3xl transition-all duration-700 hover:border-white/20 hover:bg-neutral-900/80 hover:-translate-y-2">
                                    {/* Product Visual */}
                                    <div className="h-56 shrink-0 rounded-[28px] bg-[#050505] border border-white/5 flex items-center justify-center overflow-hidden relative shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]">
                                        <div className={`absolute inset-0 opacity-40 bg-gradient-to-br ${product.color}`}></div>
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 scale-100 group-hover:scale-110"
                                            draggable="false"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                                        <div className="absolute bottom-8 left-8 flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-2xl ${product.iconColor} shadow-lg flex items-center justify-center`}>
                                                <div className="w-4 h-4 rounded-full bg-white/20 animate-pulse"></div>
                                            </div>
                                            <div className="h-0.5 w-12 bg-white/20 rounded-full"></div>
                                        </div>
                                    </div>

                                    {/* Product Content */}
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-3xl font-black tracking-tighter uppercase">{product.name}</h4>
                                                <span className="text-[10px] font-black tracking-widest uppercase py-1 px-3 bg-white/5 rounded-full border border-white/10 group-hover:bg-[#0052cc] group-hover:border-transparent transition-all duration-500">v2.4.0</span>
                                            </div>
                                            <p className="text-xs font-black text-[#0052cc] uppercase tracking-[0.3em]">{product.subtitle}</p>
                                            <p className="text-sm text-white/50 leading-relaxed font-semibold transition-colors duration-500 group-hover:text-white/80">{product.desc}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {product.bullets.map((bullet, bIdx) => (
                                                <div key={bIdx} className="flex items-center gap-3 group/item">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#0052cc]/30 group-hover/item:bg-[#0052cc] transition-colors duration-500"></div>
                                                    <span className="text-[10px] font-black text-white/40 group-hover/item:text-white uppercase tracking-wider transition-colors duration-500">{bullet}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none"></div>

                {/* Visual Separator */}
                <div className="absolute left-0 top-0 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
            </div>
        </div>
    );
};

export default Login;
