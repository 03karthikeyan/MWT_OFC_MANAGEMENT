import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  connected: false,
  onlineUsers: [],
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setConnected: (state, action) => {
      state.connected = action.payload;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
  },
});

export const { setConnected, setOnlineUsers } = socketSlice.actions;
export default socketSlice.reducer;
