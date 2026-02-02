import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import CustomPopup from './CustomPopup';
import '../styles/Auth.css'; // Ensure we have access to styles

const ProfileMenu = () => {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const menuRef = useRef(null);
    const fileInputRef = useRef(null);

    // Custom Popup State
    const [popup, setPopup] = useState({
        show: false,
        title: '',
        message: '',
        type: 'info',
        mode: 'alert',
        onConfirm: null
    });

    const closePopup = () => setPopup(prev => ({ ...prev, show: false }));

    const handleLogoutClick = () => {
        setIsOpen(false);
        setPopup({
            show: true,
            title: 'Confirm Logout',
            message: 'Are you sure you want to log out?',
            type: 'warning',
            mode: 'confirm',
            onConfirm: confirmLogout
        });
    };

    const confirmLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);



    const handleImageClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profile_picture', file);

        setIsUploading(true);
        try {
            const response = await authAPI.updateProfileImage(formData);
            // Update local user state with new image url
            updateUser(response.data.user);
            setPopup({
                show: true,
                title: 'Success!',
                message: 'Profile picture updated successfully.',
                type: 'success',
                mode: 'alert'
            });
        } catch (error) {
            console.error('Failed to upload image', error);
            setPopup({
                show: true,
                title: 'Upload Failed',
                message: 'Failed to upload profile image.',
                type: 'error',
                mode: 'alert'
            });
        } finally {
            setIsUploading(false);
        }
    };

    // Construct image URL (handle relative paths from Django)
    const getProfileImageUrl = () => {
        if (user?.profile_picture) {
            return user.profile_picture.startsWith('http')
                ? user.profile_picture
                : `${import.meta.env.VITE_BACKEND_URL}${user.profile_picture}`;
        }
        return null;
    };

    const profileImg = getProfileImageUrl();



    return (
        <>
            <div className="profile-menu-container" ref={menuRef}>
                {/* Avatar Trigger */}
                <div className="profile-trigger" onClick={() => setIsOpen(!isOpen)}>
                    {profileImg ? (
                        <img src={profileImg} alt="Profile" className="navbar-avatar-img" />
                    ) : (
                        <div className="navbar-avatar-placeholder">
                            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </div>
                    )}
                </div>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="profile-dropdown">
                        <div className="dropdown-header">
                            <div className="dropdown-user-info">
                                <strong>{user?.name || 'User'}</strong>
                                <span>{user?.email}</span>
                                <span className="role-badge-small">{user?.role}</span>
                            </div>
                        </div>

                        <div className="dropdown-body">
                            <div className="dropdown-item" onClick={handleImageClick}>
                                {isUploading ? 'Uploading...' : 'Change Profile Photo'}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleFileChange}
                            />

                            {/* Navigation Links based on Role */}
                            <div className="dropdown-divider"></div>

                            <div className="dropdown-item" onClick={() => navigate('/profile')}>
                                My Profile
                            </div>
                            <div className="dropdown-item" onClick={() => navigate('/dashboard')}>
                                Dashboard
                            </div>

                            {(user?.role === 'manager' || user?.role === 'employer') && (
                                <div className="dropdown-item" onClick={() => navigate('/manager-dashboard')}>
                                    Team Hierarchy
                                </div>
                            )}

                            {user?.is_staff && (
                                <>
                                    <div className="dropdown-item" onClick={() => navigate('/admin/allocation')}>
                                        Admin Allocation
                                    </div>
                                    <div className="dropdown-item" onClick={() => navigate('/admin/dotted-allocation')}>
                                        Dotted Line Allocation
                                    </div>
                                </>
                            )}

                            <div className="dropdown-divider"></div>

                            <div className="dropdown-item logout" onClick={handleLogoutClick}>
                                Logout
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <CustomPopup {...popup} onClose={closePopup} />
        </>
    );
};

export default ProfileMenu;
