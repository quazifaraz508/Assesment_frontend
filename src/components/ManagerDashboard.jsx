import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { Link } from 'react-router-dom';
import '../styles/Auth.css';

// Recursive Tree Node Component
import { useAuth } from '../context/AuthContext';

// Recursive Tree Node Component
// Recursive Tree Node Component
const TreeNode = ({ node, currentUserId }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;
    const isCurrentUser = node.id === currentUserId;

    // Helper to get image URL
    const getImageUrl = (path) => {
        if (!path) return null;
        return path.startsWith('http') ? path : `${import.meta.env.VITE_BACKEND_URL}${path}`;
    };

    const profilePic = getImageUrl(node.profile_picture);

    return (
        <div className="tree-node-wrapper">
            <div className="tree-node-content" onClick={() => setExpanded(!expanded)}>
                <div className={`node-card ${hasChildren ? 'is-parent' : ''} ${isCurrentUser ? 'is-current-user' : ''}`}>
                    {profilePic ? (
                        <img
                            src={profilePic}
                            alt={node.name}
                            className="node-avatar-img"
                            style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: isCurrentUser ? '2px solid #a855f7' : '2px solid #e2e8f0',
                                marginBottom: '0.5rem'
                            }}
                        />
                    ) : (
                        <div className="node-avatar">{node.name.charAt(0)}</div>
                    )}

                    <div className="node-info">
                        <strong>{node.name} {isCurrentUser && '(You)'}</strong>
                        <span className="node-role">{node.designation || node.role}</span>
                    </div>
                </div>
                {hasChildren && (
                    <div
                        className="node-toggle"
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    >
                        {expanded ? '−' : '+'}
                    </div>
                )}
            </div>

            {expanded && hasChildren && (
                <div className="tree-children">
                    {node.children.map(child => (
                        <div key={child.id} className="org-child-wrapper">
                            <TreeNode node={child} currentUserId={currentUserId} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

import ProfileMenu from './ProfileMenu';

const ManagerDashboard = () => {
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

    if (loading) return <div className="loading">Loading Hierarchy...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Reporting Manager Dashboard</h1>
                    <div className="header-actions">
                        <ProfileMenu />
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="welcome-card">
                    <div className="welcome-text">
                        <h2>Team Hierarchy</h2>
                        <p>Visual representation of your reporting structure</p>
                    </div>
                </div>

                <div className="hierarchy-container">
                    {treeData.length === 0 ? (
                        <p>No team members assigned yet.</p>
                    ) : (
                        treeData.map(node => (
                            <TreeNode key={node.id} node={node} currentUserId={user?.id} />
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

export default ManagerDashboard;
