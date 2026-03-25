import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import TaskList from '../components/TaskList.jsx';
import TaskForm from '../components/TaskForm.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { notifyError } from '../utils/toastNotify.js';
import './Dashboard.css';

const Dashboard = ({ session, onLogout }) => {
  const confirm = useConfirm();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [users, setUsers] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'board'
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchUserInfo();
    fetchTasks();
    if (userRole === 'team_leader') {
      fetchUsers();
    }
  }, [session, userRole]);

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/api/user');
      setCurrentUser(response.data);
      setUserRole(response.data.role);
    } catch (error) {
      console.error('Error fetching user info:', error);
      const email = session?.user?.email;
      const id = session?.user?.id;
      if (email || id) {
        setCurrentUser({
          id: id ?? null,
          email: email ?? '',
          role: userRole ?? 'user',
        });
        setUserRole(userRole ?? 'user');
      }
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      await api.post('/api/tasks', taskData);
      setShowForm(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      notifyError(error.response?.data?.error || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await api.put(`/api/tasks/${taskId}`, updates);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      notifyError(error.response?.data?.error || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    const ok = await confirm({
      title: 'Delete task',
      message: 'Are you sure you want to delete this task?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      danger: true,
    });
    if (!ok) return;

    try {
      await api.delete(`/api/tasks/${taskId}`);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      notifyError(error.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleFormSubmit = async (taskData) => {
    if (editingTask) {
      await handleUpdateTask(editingTask.id, taskData);
      setEditingTask(null);
    } else {
      await handleCreateTask(taskData);
    }
    setShowForm(false);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      user: '#6366f1',
      team_member: '#3b82f6',
      team_leader: '#8b5cf6'
    };
    return (
      <span 
        className="role-badge" 
        style={{ backgroundColor: roleColors[role] || '#6366f1' }}
      >
        {role.replace('_', ' ')}
      </span>
    );
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    return { total, completed, inProgress, pending };
  };

  const stats = getTaskStats();

  if (loading && !currentUser) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">✓</div>
            <span className="logo-text">Taskly</span>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
            <span className="nav-icon">📊</span>
            {sidebarOpen && <span>Dashboard</span>}
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">✓</span>
            {sidebarOpen && <span>My Tasks</span>}
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">📁</span>
            {sidebarOpen && <span>Projects</span>}
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">📅</span>
            {sidebarOpen && <span>Calendar</span>}
          </a>
        </nav>

        {sidebarOpen && (
          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="user-avatar">
                {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <div className="user-name">{currentUser?.email?.split('@')[0] || 'User'}</div>
                <div className="user-email">{currentUser?.email}</div>
              </div>
            </div>
            <button onClick={onLogout} className="logout-btn-sidebar">
              Logout
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back! Here&apos;s what&apos;s happening today.</p>
          </div>
          <div className="header-right">
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                List
              </button>
              <button 
                className={`view-btn ${viewMode === 'board' ? 'active' : ''}`}
                onClick={() => setViewMode('board')}
              >
                Board
              </button>
            </div>
            <button 
              onClick={() => setShowForm(true)} 
              className="create-task-btn-primary"
            >
              <span>+</span> New Task
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-icon">📋</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
          </div>
          <div className="stat-card stat-completed">
            <div className="stat-icon">✓</div>
            <div className="stat-info">
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          <div className="stat-card stat-progress">
            <div className="stat-icon">⚡</div>
            <div className="stat-info">
              <div className="stat-value">{stats.inProgress}</div>
              <div className="stat-label">In Progress</div>
            </div>
          </div>
          <div className="stat-card stat-pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="tasks-section">
          <div className="section-header">
            <h2>My Tasks</h2>
            {getRoleBadge(userRole)}
          </div>

          {loading ? (
            <div className="loading">Loading tasks...</div>
          ) : (
            <TaskList
              tasks={tasks}
              onUpdate={handleUpdateTask}
              onDelete={handleDeleteTask}
              onEdit={handleEditTask}
              currentUser={currentUser}
              userRole={userRole}
              viewMode={viewMode}
            />
          )}
        </div>

        {/* Task Form Modal */}
        {showForm && (
          <TaskForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            task={editingTask}
            users={users}
            userRole={userRole}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
