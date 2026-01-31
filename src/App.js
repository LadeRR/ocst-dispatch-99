import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Login from './components/Login';
import MobileView from './components/MobileView';
import DispatchView from './components/DispatchView';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to socket when user logs in
    if (user) {
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001');
      
      newSocket.on('connect', () => {
        console.log('Socket connected');
        newSocket.emit('user-connected', user);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    if (socket) {
      socket.close();
    }
    setUser(null);
    setSocket(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Mobil cihazdan giriş yapıldıysa Mobile View
  if (user.deviceType === 'mobile') {
    return <MobileView user={user} socket={socket} onLogout={handleLogout} />;
  }

  // PC'den giriş yapıldıysa Dispatch View
  return <DispatchView user={user} socket={socket} onLogout={handleLogout} />;
}

export default App;