import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../services/api';

// Async Thunks
export const fetchProjects = createAsyncThunk('data/fetchProjects', async () => {
  const response = await api.getProjects();
  return response.data.projects;
});

export const fetchWorkUpdates = createAsyncThunk('data/fetchWorkUpdates', async (params) => {
  const response = await api.getMyWork(params);
  return response.data.workUpdates || response.data;
});

export const fetchAllWork = createAsyncThunk('data/fetchAllWork', async (params) => {
  const response = await api.getAllWork(params);
  return response.data.workUpdates || response.data;
});

export const fetchNotifications = createAsyncThunk('data/fetchNotifications', async () => {
  const response = await api.getMyNotifications();
  return response.data.notifications;
});

export const fetchRequests = createAsyncThunk('data/fetchRequests', async () => {
  const response = await api.getMyRequests();
  return response.data.requests || response.data;
});

export const fetchIncomingRequests = createAsyncThunk('data/fetchIncomingRequests', async () => {
  const response = await api.getIncomingRequests();
  return response.data.requests || [];
});

export const fetchAttendance = createAsyncThunk('data/fetchAttendance', async () => {
  const response = await api.getTodayAttendance();
  return response.data.attendance;
});

export const fetchAllAttendance = createAsyncThunk('data/fetchAllAttendance', async (params) => {
  const response = await api.getAllAttendance(params);
  return response.data.attendance || [];
});

export const fetchUsers = createAsyncThunk('data/fetchUsers', async () => {
  const response = await api.getUsers();
  return response.data.users || [];
});

export const fetchMyAttendance = createAsyncThunk('data/fetchMyAttendance', async () => {
  const response = await api.getMyAttendance();
  return response.data.attendance || [];
});

export const fetchOnDuty = createAsyncThunk('data/fetchOnDuty', async () => {
  const response = await api.getMyOnDuty();
  return response.data.onDutyRecords || [];
});

export const fetchLeaves = createAsyncThunk('data/fetchLeaves', async () => {
  const response = await api.getMyLeaves();
  return response.data.leaves || [];
});

export const fetchAllLeaves = createAsyncThunk('data/fetchAllLeaves', async () => {
  const response = await api.getAllLeaves();
  return response.data.leaves || [];
});

export const fetchDashboardData = createAsyncThunk('data/fetchDashboardData', async () => {
  const response = await api.getDashboardData();
  return response.data;
});

export const fetchDashboardStats = createAsyncThunk('data/fetchDashboardStats', async () => {
  const response = await api.getDashboardStats();
  return response.data;
});

const initialState = {
  projects: [],
  workUpdates: [],
  allWork: [],
  notifications: [],
  requests: [],
  incomingRequests: [],
  attendance: null,
  allAttendance: [],
  myAttendance: [],
  users: [],
  onDuty: [],
  leaves: [],
  allLeaves: [],
  stats: {
    totalTasks: 0,
    completedTasks: 0,
    leavesTaken: 0,
    attendanceRate: 0,
    totalWorkingHours: 0,
    totalWorkingDays: 0,
    onDutyDays: 0,
    pendingLeaves: 0,
    pendingRequests: 0,
    pendingOnDuty: 0,
    totalUsers: 0,
    presentToday: 0,
    totalInvoiced: 0,
    totalCollected: 0,
    activeInterns: 0
  },
  loading: {
    projects: false,
    work: false,
    notifications: false,
    requests: false,
    attendance: false,
    onDuty: false,
    leaves: false,
    users: false,
    stats: false
  },
  error: null,
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    // Projects
    updateProjectInState: (state, action) => {
      const index = state.projects.findIndex(p => p._id === action.payload._id);
      if (index !== -1) state.projects[index] = action.payload;
      else state.projects.unshift(action.payload);
    },
    removeProjectFromState: (state, action) => {
      state.projects = state.projects.filter(p => p._id !== action.payload);
    },
    
    // Notifications
    addNotificationToState: (state, action) => {
      state.notifications.unshift(action.payload);
      if (state.notifications.length > 20) state.notifications.pop();
    },
    
    // Work Updates
    addWorkUpdateToState: (state, action) => {
      // For personal/admin specific work lists
      const exists = state.workUpdates.find(w => w._id === action.payload._id);
      if (!exists) {
        state.workUpdates.unshift(action.payload);
      }
      
      // Also update allWork if it exists
      const existsInAll = state.allWork.find(w => w._id === action.payload._id);
      if (!existsInAll) {
        state.allWork.unshift(action.payload);
        if (state.allWork.length > 100) state.allWork.pop();
      }
    },
    
    // Attendance
    updateAttendanceInState: (state, action) => {
      state.attendance = action.payload;
      
      // Also update in allAttendance
      const index = state.allAttendance.findIndex(a => a._id === action.payload._id);
      if (index !== -1) state.allAttendance[index] = action.payload;
      else state.allAttendance.unshift(action.payload);
    },

    // Requests
    addRequestToState: (state, action) => {
      state.incomingRequests.unshift(action.payload);
    },

    updateRequestStatusInState: (state, action) => {
      const { id, status } = action.payload;
      const req = state.requests.find(r => r._id === id);
      if (req) req.status = status;
      
      const incReq = state.incomingRequests.find(r => r._id === id);
      if (incReq) incReq.status = status;
    },

    // Stats
    updateStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
    },

    // Reset Data
    resetData: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Projects
      .addCase(fetchProjects.pending, (state) => { state.loading.projects = true; })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading.projects = false;
        state.projects = action.payload;
      })
      // Work
      .addCase(fetchWorkUpdates.fulfilled, (state, action) => {
        state.workUpdates = action.payload;
      })
      .addCase(fetchAllWork.fulfilled, (state, action) => {
        state.allWork = action.payload;
      })
      // Notifications
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
      })
      // Requests
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.requests = action.payload;
      })
      .addCase(fetchIncomingRequests.fulfilled, (state, action) => {
        state.incomingRequests = action.payload;
      })
      // Attendance
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.attendance = action.payload;
      })
      .addCase(fetchAllAttendance.fulfilled, (state, action) => {
        state.allAttendance = action.payload;
      })
      .addCase(fetchMyAttendance.fulfilled, (state, action) => {
        state.myAttendance = action.payload;
      })
      // Users
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users = action.payload;
      })
      // On Duty
      .addCase(fetchOnDuty.fulfilled, (state, action) => {
        state.onDuty = action.payload;
      })
      // Leaves
      .addCase(fetchLeaves.fulfilled, (state, action) => {
        state.leaves = action.payload;
      })
      .addCase(fetchAllLeaves.fulfilled, (state, action) => {
        state.allLeaves = action.payload;
      })
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading.stats = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.stats = { ...state.stats, ...action.payload };
      })
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading.users = true;
        state.loading.work = true;
        state.loading.notifications = true;
        state.loading.requests = true;
        state.loading.attendance = true;
        state.loading.leaves = true;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        const {
          allAttendance,
          allWork,
          allLeaves,
          notifications,
          incomingRequests
        } = action.payload;

        state.allAttendance = allAttendance;
        state.allWork = allWork;
        state.allLeaves = allLeaves;
        state.notifications = notifications;
        state.incomingRequests = incomingRequests;

        // Additional stats calculations
        state.stats.presentToday = allAttendance?.length || state.stats.presentToday;
        state.stats.pendingLeaves = allLeaves?.filter(l => l.status === 'pending').length || 0;
        state.stats.pendingRequests = incomingRequests?.filter(r => r.status === 'Pending').length || 0;

        // Set all loading to false
        state.loading.users = false;
        state.loading.work = false;
        state.loading.notifications = false;
        state.loading.requests = false;
        state.loading.attendance = false;
        state.loading.leaves = false;
      });
  },
});

export const { 
  updateProjectInState, 
  removeProjectFromState, 
  addNotificationToState,
  addWorkUpdateToState,
  updateAttendanceInState,
  addRequestToState,
  updateRequestStatusInState,
  updateStats,
  resetData
} = dataSlice.actions;

export default dataSlice.reducer;
