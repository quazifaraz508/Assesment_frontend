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
import '../styles/Auth.css';

// Sortable Item Component
const SortableItem = ({ id, user, onRemove, highlightManagers = false, hasTeam = false }) => {
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

    const isManager = highlightManagers && (user.role === 'manager' || user.is_manager);

    // Clean Indigo Theme for Managers
    const highlightColor = '#6366f1'; // Indigo-500
    const highlightBg = '#eef2ff';    // Indigo-50
    const textColor = '#4338ca';      // Indigo-700

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="draggable-item"
        >
            {hasTeam && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: '8px',
                    border: `2px solid ${highlightColor}`,
                    background: highlightBg,
                    opacity: 0.4,
                    pointerEvents: 'none',
                    zIndex: 1
                }} />
            )}

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
                        border: hasTeam ? `1px solid ${highlightColor}` : 'none'
                    }}
                />
            ) : (
                <div className="user-avatar-sm" style={{
                    color: hasTeam ? highlightColor : 'inherit',
                    background: hasTeam ? highlightBg : 'inherit'
                }}>{user.name.charAt(0)}</div>
            )}

            <div className="user-info-sm" style={{ position: 'relative', zIndex: 2 }}>
                <span className="name" style={{
                    fontWeight: hasTeam ? '600' : '400',
                    color: hasTeam ? textColor : 'inherit',
                    display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                    {user.name}
                    {hasTeam && <span style={{
                        fontSize: '0.65rem',
                        color: highlightColor,
                        background: '#fff',
                        border: `1px solid ${highlightColor}`,
                        padding: '1px 6px',
                        borderRadius: '10px',
                        whiteSpace: 'nowrap',
                        fontWeight: 'bold'
                    }}>Reporting Manager</span>}
                </span>
                <span className="role">{user.role}</span>
            </div>
            {onRemove && (
                <button
                    className="icon-btn remove-user-btn"
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag on button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    style={{ position: 'relative', zIndex: 2, marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#ef4444' }}
                >
                    ×
                </button>
            )}
        </div>
    );
};

// Manager Droppable Container
const ManagerContainer = ({ manager, employees, onRemoveManager, onUnassignUser }) => {
    // We strictly use the manager's ID as the container ID for drop detection
    const { setNodeRef } = useSortable({
        id: `manager-${manager.id}`,
        data: { type: 'manager', managerId: manager.id }
    });

    return (
        <div ref={setNodeRef} className="manager-column">
            <div className="manager-header" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {manager.profile_picture ? (
                    <img
                        src={manager.profile_picture.startsWith('http') ? manager.profile_picture : `${import.meta.env.VITE_BACKEND_URL}${manager.profile_picture}`}
                        alt={manager.name}
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            marginBottom: '0.5rem',
                            border: '2px solid #e2e8f0'
                        }}
                    />
                ) : (
                    <div className="user-avatar-sm" style={{ width: '48px', height: '48px', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                        {manager.name.charAt(0)}
                    </div>
                )}
                <h3>{manager.name}</h3>
                <span className="badge">{manager.designation}</span>
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
                        color: '#94a3b8',
                        lineHeight: 1
                    }}
                    title="Hide Manager"
                >
                    ×
                </button>
            </div>
            <div className="manager-droppable-area">
                <SortableContext
                    items={employees.map(e => e.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {employees.map(user => (
                        <SortableItem
                            key={user.id}
                            id={user.id}
                            user={user}
                            onRemove={() => onUnassignUser(user.id)}
                        />
                    ))}
                    {employees.length === 0 && <div className="empty-placeholder">Drop employees here</div>}
                </SortableContext>
            </div>
        </div>
    );
};

const AdminAllocation = () => {
    const [availableManagers, setAvailableManagers] = useState([]); // List of all potential managers from API
    const [displayedManagers, setDisplayedManagers] = useState([]); // Managers currently shown as columns
    const [users, setUsers] = useState([]); // All users state for allocation
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState(null);
    const [showAddManagerModal, setShowAddManagerModal] = useState(false);

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
            const allManagers = managersRes.data;
            const allUsers = usersRes.data;

            setAvailableManagers(allManagers);
            setUsers(allUsers);

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

        const activeUser = users.find(u => u.id === active.id);

        if (activeUser && activeUser.reporting_manager === targetManagerId) {
            return;
        }

        // Optimistic UI Update
        setUsers(users.map(u => {
            if (u.id === active.id) {
                return { ...u, reporting_manager: targetManagerId };
            }
            return u;
        }));

        try {
            await authAPI.allocateUser({
                user_id: active.id,
                manager_id: targetManagerId
            });
        } catch (err) {
            console.error("Allocation failed", err);
            fetchData();
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
                                    return (
                                        <SortableItem
                                            key={user.id}
                                            id={user.id}
                                            user={user}
                                            highlightManagers={true}
                                            hasTeam={hasTeam}
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

            <CustomPopup {...popup} onClose={closePopup} />
        </div>
    );
};

export default AdminAllocation;
