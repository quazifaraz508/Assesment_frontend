import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import ProfileMenu from './ProfileMenu';
import CustomPopup from './CustomPopup';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, User as UserIcon, Trash2, Clock, AlertCircle, Users } from 'lucide-react';
import '../styles/Auth.css';

const getManagerColor = (id) => {
    if (!id) return { primary: '#6366f1', bg: '#eef2ff', text: '#4338ca' };
    const hue = (id * 137.5) % 360;
    return {
        primary: `hsl(${hue}, 65%, 45%)`,
        bg: `hsl(${hue}, 75%, 97%)`,
        text: `hsl(${hue}, 70%, 25%)`,
        name: `Color-${Math.round(hue)}`
    };
};

// Sortable Item Component
const SortableUser = ({ id, user, onRemove, assignment, isTemporary }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className={`draggable-item ${isTemporary ? 'temporary-item' : ''}`}
            style={{
                ...style,
                borderLeft: isTemporary ? '4px solid #f59e0b' : '4px solid transparent',
                background: isTemporary ? '#fffbeb' : 'white'
            }}
        >
            {user.profile_picture ? (
                <img
                    src={user.profile_picture.startsWith('http') ? user.profile_picture : `${import.meta.env.VITE_BACKEND_URL}${user.profile_picture}`}
                    alt={user.name}
                    className="user-avatar-sm-img"
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', marginRight: '0.75rem' }}
                />
            ) : (
                <div className="user-avatar-sm">{user.name?.charAt(0) || user.email?.charAt(0)}</div>
            )}

            <div className="user-info-sm" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="name" style={{ fontWeight: isTemporary ? '600' : '400' }}>{user.name || user.email}</span>
                </div>
                {isTemporary && assignment && (
                    <div className="dotted-period" style={{ fontSize: '0.65rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={10} /> {assignment.start_date} to {assignment.end_date}
                    </div>
                )}
            </div>

            {onRemove && (
                <button
                    className="icon-btn remove-user-btn"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
};

// Manager Container
const ManagerColumn = ({ manager, assignments, managerSubordinates, allUsers, onRemoveAssignment }) => {
    const { setNodeRef } = useSortable({
        id: `manager-${manager.id}`,
        data: { type: 'manager', managerId: manager.id }
    });

    const managerAssignments = assignments.filter(a => a.dotted_line_manager === manager.id);

    return (
        <div ref={setNodeRef} className="manager-column" style={{ minWidth: '280px', flex: '1 1 300px', borderTop: `4px solid ${manager.color?.primary}` }}>
            <div className="manager-header" style={{
                position: 'relative',
                padding: '1.5rem 1rem',
                background: manager.color?.bg,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                {manager.profile_picture ? (
                    <img
                        src={manager.profile_picture.startsWith('http') ? manager.profile_picture : `${import.meta.env.VITE_BACKEND_URL}${manager.profile_picture}`}
                        alt={manager.name}
                        style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', marginBottom: '0.75rem', border: `2px solid ${manager.color?.primary}` }}
                    />
                ) : (
                    <div className="user-avatar-sm" style={{
                        width: '56px',
                        height: '56px',
                        fontSize: '1.8rem',
                        marginBottom: '0.75rem',
                        background: '#fff',
                        color: manager.color?.primary,
                        border: `1px solid ${manager.color?.primary}`
                    }}>
                        {manager.name?.charAt(0)}
                    </div>
                )}
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: manager.color?.text }}>{manager.name}</h3>
                <span className="badge" style={{ background: manager.color?.primary, color: '#fff', marginTop: '4px' }}>{manager.designation}</span>
            </div>

            <div className="manager-droppable-area" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Permanent Team */}
                <div>
                    <h4 style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={12} /> Permanent Team
                    </h4>
                    <SortableContext items={managerSubordinates.map(u => u.id)} strategy={verticalListSortingStrategy}>
                        {managerSubordinates.map(user => (
                            <SortableUser key={user.id} id={user.id} user={user} isTemporary={false} />
                        ))}
                        {managerSubordinates.length === 0 && <div className="empty-placeholder" style={{ padding: '0.5rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: '6px' }}>No permanent reports</div>}
                    </SortableContext>
                </div>

                {/* Temporary Team */}
                <div style={{ marginTop: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.75rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> Temporary Teammates
                    </h4>
                    <SortableContext items={managerAssignments.map(a => a.id)} strategy={verticalListSortingStrategy}>
                        {managerAssignments.map(assignment => {
                            const user = allUsers.find(u => u.id === assignment.user);
                            if (!user) return null;
                            return (
                                <SortableUser
                                    key={assignment.id}
                                    id={assignment.id}
                                    user={user}
                                    isTemporary={true}
                                    assignment={assignment}
                                    onRemove={() => onRemoveAssignment(assignment.id)}
                                />
                            );
                        })}
                        {managerAssignments.length === 0 && <div className="empty-placeholder" style={{ padding: '0.5rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', border: '1px dashed #fef3c7', borderRadius: '6px' }}>No temporary reports</div>}
                    </SortableContext>
                </div>
            </div>
        </div>
    );
};

const DottedLineAllocation = () => {
    const [managers, setManagers] = useState([]);
    const [users, setUsers] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAllocating, setIsAllocating] = useState(false);
    const [activeId, setActiveId] = useState(null);

    // Allocation Modal State
    const [showAllocModal, setShowAllocModal] = useState(false);
    const [allocData, setAllocData] = useState({
        user: null,
        managerId: null,
        startDate: '',
        endDate: '',
        reason: ''
    });

    const [popup, setPopup] = useState({ show: false, title: '', message: '', type: 'info' });
    const closePopup = () => setPopup(prev => ({ ...prev, show: false }));

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [mgrRes, usrRes] = await authAPI.getAllocateData();
            const assignmentsRes = await authAPI.getDottedAllocations();

            const allManagers = mgrRes.data.map(m => ({
                ...m,
                color: getManagerColor(m.id)
            }));
            setManagers(allManagers);
            setUsers(usrRes.data);
            setAssignments(assignmentsRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        let targetManagerId = null;
        if (over.data?.current?.type === 'manager') {
            targetManagerId = over.data.current.managerId;
        } else if (typeof over.id === 'string' && over.id.startsWith('manager-')) {
            targetManagerId = parseInt(over.id.split('-')[1]);
        } else {
            // Dropped on a permanent user item
            const overUser = users.find(u => u.id === over.id);
            if (overUser) {
                targetManagerId = overUser.reporting_manager;
            } else {
                // Dropped on a temporary teammate item (ID is assignment ID)
                const assignment = assignments.find(a => a.id === over.id);
                if (assignment) {
                    targetManagerId = assignment.dotted_line_manager;
                }
            }
        }

        if (!targetManagerId) return;

        // Find user - could be from users list or assignments
        let activeUser = users.find(u => u.id === active.id);

        // If not found, check if active.id is an assignment ID
        if (!activeUser) {
            const assignment = assignments.find(a => a.id === active.id);
            if (assignment) {
                activeUser = users.find(u => u.id === assignment.user);
            }
        }

        if (!activeUser) return;

        // Don't allow assigning to their own permanent manager
        if (activeUser.reporting_manager === targetManagerId) {
            setPopup({
                show: true,
                title: 'Invalid Action',
                message: 'This user is already a permanent report of this manager.',
                type: 'warning'
            });
            return;
        }

        // Check if user already has an active dotted line assignment
        const existingAssignment = assignments.find(a => a.user === activeUser.id && a.is_active);
        if (existingAssignment) {
            setPopup({
                show: true,
                title: 'Existing Assignment',
                message: `${activeUser.name} is already assigned to a temporary team. Please remove the existing assignment before reassigning.`,
                type: 'warning'
            });
            return;
        }

        setAllocData({
            user: activeUser,
            managerId: targetManagerId,
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            reason: ''
        });
        setShowAllocModal(true);
    };

    const handleConfirmAllocation = async () => {
        if (!allocData.startDate || !allocData.endDate) {
            alert("Please select both start and end dates.");
            return;
        }

        setIsAllocating(true);
        try {
            const payload = {
                user: allocData.user.id,
                dotted_line_manager: allocData.managerId,
                start_date: allocData.startDate,
                end_date: allocData.endDate,
                reason: allocData.reason
            };

            const res = await authAPI.allocateDottedUser(payload);
            setAssignments([...assignments, res.data]);
            setShowAllocModal(false);

            setPopup({
                show: true,
                title: 'Success!',
                message: `User assigned to dotted-line manager. Notifications have been sent to Slack and Email.`,
                type: 'success'
            });
        } catch (err) {
            console.error(err);
            alert("Failed to create assignment");
        } finally {
            setIsAllocating(false);
        }
    };

    const handleRemoveAssignment = async (id) => {
        try {
            await authAPI.removeDottedAllocation(id);
            setAssignments(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="loading-container">Loading...</div>;

    // Filter managers who have at least one permanent report
    const activeManagers = managers.filter(m => users.some(u => u.reporting_manager === m.id));

    return (
        <div className="allocation-container">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Dotted Line Allocation</h1>
                    <div className="header-actions">
                        <ProfileMenu />
                    </div>
                </div>
            </header>

            <div className="info-banner" style={{ margin: '1rem 2rem', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users color="#3b82f6" />
                <p style={{ margin: 0, color: '#1e40af', fontSize: '0.9rem' }}>
                    Drag an employee from their <strong>Permanent Team</strong> to another manager's column to create a <strong>Temporary Dotted Line Assignment</strong>.
                </p>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="allocation-board" style={{ padding: '0 2rem' }}>
                    <div className="managers-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '2rem',
                        width: '100%'
                    }}>
                        {activeManagers.map(manager => (
                            <ManagerColumn
                                key={manager.id}
                                manager={manager}
                                assignments={assignments}
                                managerSubordinates={users.filter(u => u.reporting_manager === manager.id)}
                                allUsers={users}
                                onRemoveAssignment={handleRemoveAssignment}
                            />
                        ))}
                    </div>
                </div>

                <DragOverlay>
                    {activeId ? (
                        <div className="draggable-item overlay">
                            {(() => {
                                const user = users.find(u => u.id === activeId);
                                if (user) return user.name;
                                const assignment = assignments.find(a => a.id === activeId);
                                if (assignment) {
                                    return users.find(u => u.id === assignment.user)?.name || 'User';
                                }
                                return 'User';
                            })()}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Allocation Modal */}
            {showAllocModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ background: '#e0f2fe', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                <Calendar color="#0ea5e9" size={32} />
                            </div>
                            <h3>Set Assignment Period</h3>
                            <p style={{ color: '#64748b' }}>
                                Assign <strong>{allocData.user?.name}</strong> to <strong>{managers.find(m => m.id === allocData.managerId)?.name}</strong>
                            </p>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Start Date</label>
                            <input
                                type="date"
                                value={allocData.startDate}
                                onChange={(e) => setAllocData({ ...allocData, startDate: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>End Date</label>
                            <input
                                type="date"
                                value={allocData.endDate}
                                onChange={(e) => setAllocData({ ...allocData, endDate: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                        </div>

                        <div className="modal-actions" style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn-secondary" onClick={() => setShowAllocModal(false)} style={{ flex: 1 }} disabled={isAllocating}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleConfirmAllocation}
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                disabled={isAllocating}
                            >
                                {isAllocating ? (
                                    <>
                                        <div className="spinner-sm" style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                                        Processing...
                                    </>
                                ) : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <CustomPopup {...popup} onClose={closePopup} />
        </div>
    );
};

export default DottedLineAllocation;
