import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileMenu from './ProfileMenu';
import '../styles/Auth.css';

const UserProfile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>My Profile</h1>
                    <div className="header-actions">
                        <Link to="/dashboard" className="btn-secondary">Back to Dashboard</Link>
                        <ProfileMenu />
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="profile-card" style={{ marginTop: '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>Profile Information</h3>
                    </div>

                    <div className="profile-grid">
                        <div className="profile-item">
                            <label>Email</label>
                            <span>{user?.email}</span>
                        </div>
                        <div className="profile-item">
                            <label>Role</label>
                            <span className="role-badge">{user?.role || 'N/A'}</span>
                        </div>
                        <div className="profile-item">
                            <label>Employee ID</label>
                            <span>{user?.employee_id || 'N/A'}</span>
                        </div>
                        <div className="profile-item">
                            <label>Department</label>
                            <span>{user?.department || 'N/A'}</span>
                        </div>
                        <div className="profile-item">
                            <label>Designation</label>
                            <span>{user?.designation || 'N/A'}</span>
                        </div>
                        <div className="profile-item">
                            <label>Phone</label>
                            <span>{user?.phone_number || 'N/A'}</span>
                        </div>
                        <div className="profile-item">
                            <label>Personal Email</label>
                            <span>{user?.personal_email || 'N/A'}</span>
                        </div>
                        <div className="profile-item">
                            <label>Date of Joining</label>
                            <span>{user?.date_of_joining || 'N/A'}</span>
                        </div>
                        <div className="profile-item">
                            <label>Office Location</label>
                            <span>{user?.office_location || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

import { Link } from 'react-router-dom';
export default UserProfile;
