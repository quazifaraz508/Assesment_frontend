import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { Link } from 'react-router-dom';
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

    // Golden angle approximation for even distribution of hues
    const hue = (id * 137.508) % 360;

    return {
        primary: `hsl(${hue}, 65%, 45%)`,
        bg: `hsl(${hue}, 70%, 97%)`,
        text: `hsl(${hue}, 70%, 25%)`,
        name: `Color-${Math.round(hue)}`
    };
};

// Sortable Item Component
const SortableItem = ({ id, user, onRemove, highlightManagers = false, hasTeam = false, managerColor, isDimmed, dottedManagerColor, hideManagerTag = false }) => {
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

    // Use specific manager color if provided, otherwise default indigo
    const primaryColor = managerColor?.primary || '#6366f1';
    const bgColor = isDimmed ? (dottedManagerColor?.bg || '#f8fafc') : (managerColor?.bg || '#eef2ff');
    const textColor = isDimmed ? '#94a3b8' : (managerColor?.text || '#4338ca');

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                opacity: isDimmed ? 0.7 : 1,
                borderLeft: isDimmed ? `4px solid ${dottedManagerColor?.primary || '#94a3b8'}` : 'none',
                background: isDimmed ? '#f8fafc' : 'white',
                cursor: 'grab'
            }}
            {...attributes}
            {...listeners}
            className={`draggable-item ${isDimmed ? 'dimmed-item' : ''}`}
        >
            {isDimmed && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255, 255, 255, 0.4)', pointerEvents: 'none', zIndex: 3, borderRadius: '8px'
                }} />
            )}
            {hasTeam && !isDimmed && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: '8px',
                    border: `2px solid ${primaryColor}`,
                    background: bgColor,
                    opacity: 0.2,
                    pointerEvents: 'none',
                    zIndex: 1
                }} />
            )}

            <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', width: '100%' }}>
                {user.profile_picture ? (
                    <img
                        src={user.profile_picture.startsWith('http') ? user.profile_picture : `${import.meta.env.VITE_BACKEND_URL}${user.profile_picture}`}
                        alt={user.name}
                        className="user-avatar-sm-img"
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            marginRight: '0.75rem',
                            border: hasTeam ? `1px solid ${primaryColor}` : 'none'
                        }}
                    />
                ) : (
                    <div className="user-avatar-sm" style={{
                        color: hasTeam ? primaryColor : 'inherit',
                        background: hasTeam ? bgColor : 'inherit',
                        border: hasTeam ? `1px solid ${primaryColor}` : 'none'
                    }}>{user.name.charAt(0)}</div>
                )}

                <div className="user-info-sm" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="name" style={{
                            fontWeight: hasTeam ? '600' : '400',
                            color: hasTeam ? textColor : 'inherit',
                        }}>
                            {user.name}
                        </span>
                        {hasTeam && !hideManagerTag && <span style={{
                            fontSize: '0.6rem',
                            color: primaryColor,
                            background: '#fff',
                            border: `1px solid ${primaryColor}`,
                            padding: '1px 6px',
                            borderRadius: '10px',
                            whiteSpace: 'nowrap',
                            fontWeight: 'bold'
                        }}>Reporting Manager</span>}
                        {isDimmed && (
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.65rem',
                                color: '#14b8a6',
                                background: '#f0fdfa',
                                padding: '2px 6px',
                                borderRadius: '999px',
                                border: '1px solid #ccfbf1',
                                lineHeight: '1'
                            }}>
                                <Clock size={10} /> Temporarily Assigned
                            </span>
                        )}
                    </div>
                    <span className="role">{user.role}</span>
                </div>
                {onRemove && (
                    <button
                        className="icon-btn remove-user-btn"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#ef4444' }}
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
};

// Manager Droppable Container
const ManagerContainer = ({ manager, employees, onRemoveManager, onUnassignUser, color, assignments, allManagers, allUsers }) => {
    // We strictly use the manager's ID as the container ID for drop detection
    const { setNodeRef } = useSortable({
        id: `manager-${manager.id}`,
        data: { type: 'manager', managerId: manager.id }
    });

    return (
        <div ref={setNodeRef} className="manager-column" style={{ borderTop: `4px solid ${color.primary}` }}>
            <div className="manager-header" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', background: color.bg, padding: '1.5rem 1rem' }}>
                {manager.profile_picture ? (
                    <img
                        src={manager.profile_picture.startsWith('http') ? manager.profile_picture : `${import.meta.env.VITE_BACKEND_URL}${manager.profile_picture}`}
                        alt={manager.name}
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            marginBottom: '0.5rem',
                            border: `2px solid ${color.primary}`
                        }}
                    />
                ) : (
                    <div className="user-avatar-sm" style={{ width: '56px', height: '56px', fontSize: '1.8rem', marginBottom: '0.5rem', background: '#fff', color: color.primary, border: `1px solid ${color.primary}` }}>
                        {manager.name.charAt(0)}
                    </div>
                )}
                <h3 style={{ color: color.text }}>{manager.name}</h3>
                <span className="badge" style={{ background: color.primary, color: '#fff' }}>{manager.designation}</span>
                <button
                    className="icon-btn remove-manager-btn"
                    onClick={() => onRemoveManager(manager.id)}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: color.primary,
                        opacity: 0.5,
                        lineHeight: 1
                    }}
                    title="Hide Manager"
                >
                    ×
                </button>
            </div>
            <div className="manager-droppable-area" style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Permanent Team Header */}
                <div>
                    <h4 style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={12} /> Permanent Team
                    </h4>
                    <SortableContext
                        items={employees.map(e => e.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {employees.map(user => {
                            const activeAssignment = assignments.find(a => a.user === user.id && a.is_active);
                            const dottedManagerColor = activeAssignment ? allManagers.find(m => m.id === activeAssignment.dotted_line_manager)?.color : null;

                            return (
                                <SortableItem
                                    key={user.id}
                                    id={user.id}
                                    user={user}
                                    onRemove={() => onUnassignUser(user.id)}
                                    managerColor={color}
                                    isDimmed={!!activeAssignment}
                                    dottedManagerColor={dottedManagerColor}
                                />
                            );
                        })}
                        {employees.length === 0 && <div className="empty-placeholder">No permanent reports</div>}
                    </SortableContext>
                </div>

                {/* Temporary Teammates Header */}
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0' }}>
                    <h4 style={{ fontSize: '0.7rem', color: color.primary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> Temporary Teammates
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {assignments
                            .filter(a => a.dotted_line_manager === manager.id && a.is_active)
                            .map(assignment => {
                                const user = allUsers.find(u => u.id === assignment.user);
                                if (!user) return null;

                                const managerColor = allManagers.find(m => m.id === user.reporting_manager)?.color;

                                return (
                                    <SortableItem
                                        key={`temp-${assignment.id}`}
                                        id={`temp-${assignment.id}`}
                                        user={user}
                                        managerColor={managerColor}
                                        dottedManagerColor={color}
                                        isDimmed={false}
                                    />
                                );
                            })}
                        {assignments.filter(a => a.dotted_line_manager === manager.id && a.is_active).length === 0 && (
                            <div className="empty-placeholder" style={{ fontSize: '0.7rem', borderStyle: 'dotted', padding: '0.5rem' }}>No temporary teammates</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminAllocation = () => {
    const [availableManagers, setAvailableManagers] = useState([]); // List of all potential managers from API
    const [displayedManagers, setDisplayedManagers] = useState([]); // Managers currently shown as columns
    const [users, setUsers] = useState([]); // All users state for allocation
    const [assignments, setAssignments] = useState([]); // All dotted assignments
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState(null);
    const [showAddManagerModal, setShowAddManagerModal] = useState(false);
    const [showPromotionModal, setShowPromotionModal] = useState(false);
    const [promotionData, setPromotionData] = useState(null);

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

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [managersRes, usersRes] = await authAPI.getAllocateData();
            const assignmentsRes = await authAPI.getDottedAllocations();

            const allManagers = managersRes.data.map((m) => ({
                ...m,
                color: getManagerColor(m.id)
            }));
            const allUsers = usersRes.data;
            const allAssignments = assignmentsRes.data;

            setAvailableManagers(allManagers);
            setUsers(allUsers);
            setAssignments(allAssignments);

            // Initial Display: Only managers who ALREADY have direct reports
            const activeManagerIds = new Set(allUsers.map(u => u.reporting_manager).filter(id => id !== null));
            const initialDisplayed = allManagers.filter(m => activeManagerIds.has(m.id));
            setDisplayedManagers(initialDisplayed);

            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    // Helper to get employees for a specific manager
    const getEmployeesForManager = (managerId) => {
        return users.filter(u => u.reporting_manager === managerId);
    };

    // Helper to get unassigned employees
    const getUnassignedEmployees = () => {
        return users.filter(u => u.reporting_manager === null);
    };

    const [managerToRemove, setManagerToRemove] = useState(null);

    const handleAddManager = (manager) => {
        if (!displayedManagers.find(m => m.id === manager.id)) {
            setDisplayedManagers([...displayedManagers, manager]);
        }
        setShowAddManagerModal(false);
    };

    const handleRemoveManagerColumn = (managerId) => {
        const manager = displayedManagers.find(m => m.id === managerId);
        if (!manager) return;

        const confirmRemove = async () => {
            // 1. Optimistic UI update
            setUsers(prevUsers => prevUsers.map(u => {
                if (u.reporting_manager === managerId) {
                    return { ...u, reporting_manager: null };
                }
                return u;
            }));

            // 2. Hide manager from display
            setDisplayedManagers(prev => prev.filter(m => m.id !== managerId));

            // 3. Backend Call
            try {
                await authAPI.deallocateManager(managerId);
                setPopup({
                    show: true,
                    title: 'Removed!',
                    message: `${manager.name} has been removed from the board.`,
                    type: 'success',
                    mode: 'alert'
                });
            } catch (err) {
                console.error("Bulk deallocation failed", err);
                setPopup({
                    show: true,
                    title: 'Error',
                    message: 'Failed to deallocate manager.',
                    type: 'error',
                    mode: 'alert'
                });
                fetchData(); // Sync with backend on error
            }
        };

        setPopup({
            show: true,
            title: 'Confirm Removal',
            message: `Are you sure you want to remove ${manager.name} from the board? All reports will be unassigned.`,
            type: 'warning',
            mode: 'confirm',
            onConfirm: confirmRemove
        });
    };

    const handleUnassignUser = async (userId) => {
        // Optimistic UI Update
        setUsers(users.map(u => {
            if (u.id === userId) {
                return { ...u, reporting_manager: null };
            }
            return u;
        }));

        try {
            await authAPI.allocateUser({
                user_id: userId,
                manager_id: null
            });
        } catch (err) {
            console.error("Unassignment failed", err);
            fetchData();
        }
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        let targetManagerId = null;

        // Parse drop target
        if (over.id.toString().startsWith('manager-container-')) {
            // Dropped on the container custom ID
            targetManagerId = parseInt(over.id.split('manager-container-')[1]);
        }
        // If sortable context handling, sometimes over.id is just "manager-X" or internal
        else if (over.data?.current?.type === 'manager') {
            targetManagerId = over.data.current.managerId;
        }
        else if (over.id === 'unassigned-pool') {
            targetManagerId = null;
        } else if (typeof over.id === 'string' && over.id.startsWith('temp-')) {
            // Dropped on a temporary teammate item
            const assignmentId = parseInt(over.id.split('temp-')[1]);
            const assignment = assignments.find(a => a.id === assignmentId);
            if (assignment) {
                targetManagerId = assignment.dotted_line_manager;
            }
        } else {
            // Dropped on another user item
            const overUser = users.find(u => u.id === over.id);
            if (overUser) {
                targetManagerId = overUser.reporting_manager;
            } else {
                // Fallback check if it was a manager container ID directly
                if (typeof over.id === 'string' && over.id.startsWith('manager-')) {
                    targetManagerId = parseInt(over.id.split('-')[1]);
                }
            }
        }

        // Find the actual user ID (might be dragging from temp section)
        let activeUserId = active.id;
        if (typeof active.id === 'string' && active.id.startsWith('temp-')) {
            const assignmentId = parseInt(active.id.split('temp-')[1]);
            const assignment = assignments.find(a => a.id === assignmentId);
            if (assignment) {
                activeUserId = assignment.user;
            }
        }

        const activeUser = users.find(u => u.id === activeUserId);

        if (activeUser && activeUser.reporting_manager === targetManagerId) {
            return;
        }

        // Check if dragging from temporary section
        if (typeof active.id === 'string' && active.id.startsWith('temp-')) {
            setPromotionData({
                userId: activeUserId,
                managerId: targetManagerId,
                userName: activeUser?.name || activeUser?.email,
                managerName: availableManagers.find(m => m.id === targetManagerId)?.name
            });
            setShowPromotionModal(true);
            return;
        }

        // Optimistic UI Update
        setUsers(users.map(u => {
            if (u.id === activeUserId) {
                return { ...u, reporting_manager: targetManagerId };
            }
            return u;
        }));

        try {
            await authAPI.allocateUser({
                user_id: activeUserId,
                manager_id: targetManagerId
            });
        } catch (err) {
            console.error("Allocation failed", err);
            fetchData();
        }
    };

    const handleConfirmPromotion = async () => {
        if (!promotionData) return;

        const { userId, managerId } = promotionData;

        // Optimistic UI Update
        setUsers(users.map(u => {
            if (u.id === userId) {
                return { ...u, reporting_manager: managerId };
            }
            return u;
        }));

        setShowPromotionModal(false);

        try {
            await authAPI.allocateUser({
                user_id: userId,
                manager_id: managerId
            });

            setPopup({
                show: true,
                title: 'Promotion Success!',
                message: `${promotionData.userName} is now a permanent report of ${promotionData.managerName}. Slack and Gmail notifications have been sent.`,
                type: 'success',
                mode: 'alert'
            });
        } catch (err) {
            console.error("Promotion failed", err);
            fetchData();
        } finally {
            setPromotionData(null);
        }
    };

    if (loading) return <div>Loading...</div>;

    // Managers that are NOT yet displayed
    const remainingManagers = availableManagers.filter(
        m => !displayedManagers.find(dm => dm.id === m.id)
    );

    return (
        <div className="allocation-container">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Admin Allocation</h1>
                    <div className="header-actions">
                        <ProfileMenu />
                    </div>
                </div>
            </header>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="allocation-board">
                    {/* Unassigned Pool */}
                    <div className="pool-column">
                        <h3>Unassigned</h3>
                        <div className="pool-area">
                            <SortableContext
                                id="unassigned-pool"
                                items={getUnassignedEmployees().map(u => u.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {getUnassignedEmployees().map(user => {
                                    // Check if this user manages anyone
                                    const hasTeam = users.some(u => u.reporting_manager === user.id);
                                    const managerColor = hasTeam ? availableManagers.find(m => m.id === user.id)?.color : null;

                                    const activeAssignment = assignments.find(a => a.user === user.id && a.is_active);
                                    const dottedManagerColor = activeAssignment ? availableManagers.find(m => m.id === activeAssignment.dotted_line_manager)?.color : null;

                                    return (
                                        <SortableItem
                                            key={user.id}
                                            id={user.id}
                                            user={user}
                                            highlightManagers={true}
                                            hasTeam={hasTeam}
                                            managerColor={managerColor}
                                            hideManagerTag={true} // Hide tag in sidebar
                                            isDimmed={!!activeAssignment}
                                            dottedManagerColor={dottedManagerColor}
                                        />
                                    );
                                })}
                                {getUnassignedEmployees().length === 0 && (
                                    <div className="empty-placeholder">All assigned!</div>
                                )}
                            </SortableContext>
                        </div>
                    </div>

                    {/* Manager Columns */}
                    <div className="managers-grid">
                        {displayedManagers.map(manager => (
                            <ManagerContainer
                                key={manager.id}
                                manager={manager}
                                employees={getEmployeesForManager(manager.id)}
                                onRemoveManager={handleRemoveManagerColumn}
                                onUnassignUser={handleUnassignUser}
                                color={manager.color}
                                assignments={assignments}
                                allManagers={availableManagers}
                                allUsers={users}
                            />
                        ))}

                        {/* + Add Manager Button/Card */}
                        <div
                            className="add-manager-card"
                            onClick={() => setShowAddManagerModal(true)}
                        >
                            <div className="add-icon">+</div>
                            <span>Add Manager</span>
                        </div>
                    </div>
                </div>

                <DragOverlay>
                    {activeId ? (
                        <div className="draggable-item overlay">
                            Dragging...
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Simple Modal for Selecting Manager */}
            {showAddManagerModal && (
                <div className="modal-overlay" onClick={() => setShowAddManagerModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Select a Reporting Manager to Add</h3>
                        <div className="manager-selection-list">
                            {remainingManagers.length === 0 ? (
                                <p>No more available managers.</p>
                            ) : (
                                remainingManagers.map(m => (
                                    <div
                                        key={m.id}
                                        className="manager-option"
                                        onClick={() => handleAddManager(m)}
                                    >
                                        {m.profile_picture ? (
                                            <img
                                                src={m.profile_picture.startsWith('http') ? m.profile_picture : `${import.meta.env.VITE_BACKEND_URL}${m.profile_picture}`}
                                                alt={m.name}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    marginRight: '0.75rem'
                                                }}
                                            />
                                        ) : (
                                            <div className="user-avatar-sm">{m.name.charAt(0)}</div>
                                        )}
                                        <span>{m.name}</span>
                                        <span className="badge">{m.designation}</span>
                                    </div>
                                ))
                            )}
                        </div>
                        <button className="btn-secondary" onClick={() => setShowAddManagerModal(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Promotion Confirmation Modal */}
            {showPromotionModal && promotionData && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <div style={{ background: '#ecfdf5', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Users color="#10b981" size={32} />
                        </div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Make Permanent?</h3>
                        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                            Are you sure you want to make <strong>{promotionData.userName}</strong> a permanent report of <strong>{promotionData.managerName}</strong>?
                            <br />
                            <span style={{ fontSize: '0.85rem', marginTop: '0.5rem', display: 'block' }}>
                                This will end their temporary assignment and send Slack/Email notifications.
                            </span>
                        </p>
                        <div className="modal-actions" style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn-secondary" onClick={() => {
                                setShowPromotionModal(false);
                                setPromotionData(null);
                                fetchData(); // Refresh to undo optimistic UI if we cancel
                            }} style={{ flex: 1 }}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleConfirmPromotion} style={{ flex: 1, background: '#10b981', borderColor: '#10b981' }}>
                                Confirm Promotion
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <CustomPopup {...popup} onClose={closePopup} />
        </div>
    );
};

export default AdminAllocation;
