import DashboardLayout from './DashboardLayout';
import UserManagement from './UserManagement';

const UsersPage = () => {
    return (
        <DashboardLayout title="User Management" subtitle="Manage users, roles, and permissions">
            <UserManagement embedded />
        </DashboardLayout>
    );
};

export default UsersPage;
