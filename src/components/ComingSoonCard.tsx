import React from 'react';
import { FiClock, FiSettings, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

interface ComingSoonCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
}

const ComingSoonCard: React.FC<ComingSoonCardProps> = ({ title, description, icon }) => {
    const navigate = useNavigate();

    return (
        <div className="p-8 h-full bg-neutral-bg flex flex-col items-center justify-center text-center">
            <button
                onClick={() => navigate(-1)}
                className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-blue-100 text-blue-900 font-bold text-xs shadow-sm hover:bg-blue-50 transition-all"
            >
                <FiArrowLeft size={16} /> Back
            </button>

            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-900 mb-6 animate-pulse">
                {icon}
            </div>

            <h1 className="text-3xl font-black text-neutral-text-main mb-3">{title}</h1>
            <p className="text-neutral-text-muted max-w-md leading-relaxed text-sm mb-8">
                {description}
            </p>

            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-blue-100 text-[10px] font-bold text-blue-900 uppercase tracking-widest">
                <FiClock size={12} className="animate-spin" /> Coming Soon in V2.0
            </div>
        </div>
    );
};

export default ComingSoonCard;
