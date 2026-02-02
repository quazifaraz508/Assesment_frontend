import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';

// Recursive Tree Node Component
const TreeNode = ({ node, currentUserId }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;
    const isCurrentUser = node.id === currentUserId;

    const getImageUrl = (path) => {
        if (!path) return null;
        return path.startsWith('http') ? path : `${import.meta.env.VITE_BACKEND_URL}${path}`;
    };

    const profilePic = getImageUrl(node.profile_picture);

    return (
        <div className="flex flex-col items-center">
            {/* Node Card */}
            <div
                onClick={() => setExpanded(!expanded)}
                className={`
                    relative flex flex-col items-center p-4 rounded-2xl cursor-pointer transition-all duration-300
                    ${isCurrentUser
                        ? 'bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-300 shadow-lg shadow-violet-200/50'
                        : hasChildren
                            ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-md'
                            : 'bg-white border border-violet-100 shadow-md'
                    }
                    hover:shadow-lg hover:-translate-y-1
                `}
            >
                {profilePic ? (
                    <img
                        src={profilePic}
                        alt={node.name}
                        className={`w-14 h-14 rounded-full object-cover mb-2 ${isCurrentUser ? 'ring-2 ring-violet-400' : 'ring-2 ring-slate-200'
                            }`}
                    />
                ) : (
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mb-2 ${isCurrentUser
                        ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                        : hasChildren
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                            : 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'
                        }`}>
                        {node.name.charAt(0)}
                    </div>
                )}
                <span className="font-bold text-slate-800 text-sm text-center">
                    {node.name} {isCurrentUser && <span className="text-violet-600">(You)</span>}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full mt-1 ${isCurrentUser
                    ? 'bg-violet-100 text-violet-700'
                    : hasChildren
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                    {node.designation || node.role}
                </span>

                {hasChildren && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-violet-200 text-violet-600 font-bold text-sm shadow-sm hover:bg-violet-50 transition-colors"
                    >
                        {expanded ? '−' : '+'}
                    </button>
                )}
            </div>

            {/* Children */}
            {expanded && hasChildren && (
                <div className="mt-8 relative">
                    {/* Vertical line from parent */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-6 -mt-6 bg-violet-200"></div>

                    {/* Horizontal line connecting children */}
                    {node.children.length > 1 && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-violet-200"></div>
                    )}

                    <div className="flex gap-8 pt-6">
                        {node.children.map((child, idx) => (
                            <div key={child.id} className="relative">
                                {/* Vertical line to child */}
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-violet-200"></div>
                                <TreeNode node={child} currentUserId={currentUserId} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const ManagerDashboard = ({ embedded = false }) => {
    const { user } = useAuth();
    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchHierarchy();
    }, []);

    const fetchHierarchy = async () => {
        try {
            const response = await authAPI.getHierarchy();
            setTreeData(response.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to load team hierarchy.');
            setLoading(false);
        }
    };

    const content = (
        <>
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-violet-600 font-semibold">Loading Hierarchy...</div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
                    {error}
                </div>
            ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg shadow-violet-100/50 p-8 overflow-x-auto">
                    <div className="min-w-max flex justify-center">
                        {treeData.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-slate-500 text-lg">No team members assigned yet.</p>
                                <p className="text-slate-400 text-sm mt-2">Team hierarchy will appear here once members are allocated.</p>
                            </div>
                        ) : (
                            <div className="flex gap-12">
                                {treeData.map(node => (
                                    <TreeNode key={node.id} node={node} currentUserId={user?.id} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );

    if (embedded) return content;

    return (
        <DashboardLayout title="My Team" subtitle="Visual representation of your reporting structure">
            {content}
        </DashboardLayout>
    );
};

export default ManagerDashboard;

