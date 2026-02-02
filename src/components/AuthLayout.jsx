import { GraduationCap, Sparkles } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle, leftTitle, leftSubtitle }) => {
    return (
        <div className="flex min-h-screen w-full font-sans text-slate-900">
            {/* Animation Keyframes */}
            <style>{`
                @keyframes fadeInUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(20px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.5s ease-out forwards;
                }
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out forwards;
                }
            `}</style>

            {/* Left Panel - Premium Design matching image */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between text-white overflow-hidden">

                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/auth-bg.png"
                        alt="Team Collaboration"
                        className="w-full h-full object-cover"
                    />
                    {/* Primary Gradient Overlay - Vibrant Purple/Violet Theme */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-700/70 via-violet-600/65 to-indigo-700/70"></div>
                    {/* Lavender/Fuchsia accent glow */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500/25 via-purple-400/15 to-violet-400/20"></div>
                    {/* Bottom fade for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-950/60 via-transparent to-transparent"></div>
                </div>

                {/* Content Container */}
                <div className="relative z-10 flex flex-col h-full p-14 justify-between">

                    {/* Brand Badge */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl">
                            <GraduationCap size={20} className="text-white" />
                        </div>
                        <span className="text-lg font-bold tracking-wide text-white">Teaching Pariksha</span>
                    </div>

                    {/* Hero Message */}
                    <div className="max-w-xl mb-10">
                        <h1 className="text-5xl font-bold leading-[1.1] mb-6 tracking-tight drop-shadow-sm">
                            {leftTitle || "Employee Assessment Platform"}
                        </h1>
                        <p className="text-lg text-white/80 leading-relaxed font-normal max-w-md">
                            {leftSubtitle || "Streamline your performance evaluations, track your growth, and achieve your career goals with our comprehensive assessment tools."}
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-6 text-[11px] font-medium text-white/50 uppercase tracking-wider">
                        <span>© 2024 Teaching Pariksha</span>
                        <div className="flex gap-6">
                            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
                            <span className="hover:text-white transition-colors cursor-pointer">Contact Support</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form Area */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 relative bg-white">
                <div className="w-full max-w-[420px] space-y-8 animate-fade-in-up">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="p-3 bg-violet-600 rounded-xl shadow-lg shadow-violet-500/30">
                            <GraduationCap size={28} className="text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-800">Teaching Pariksha</span>
                    </div>

                    {/* Header */}
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h2>
                        <p className="text-slate-500 text-[15px]">{subtitle}</p>
                    </div>

                    {/* Form Content */}
                    <div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;

