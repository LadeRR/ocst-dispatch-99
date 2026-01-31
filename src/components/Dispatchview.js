import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to handle map zoom and center
function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 15);
    }
  }, [center, zoom, map]);
  
  return null;
}

const DispatchView = ({ user, socket, onLogout }) => {
  const [calls, setCalls] = useState([]);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [mapCenter, setMapCenter] = useState([34.0522, -118.2437]); // Default: Los Angeles
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  const chatEndRef = useRef(null);

  // Predefined locations (Grand Theft Auto V inspired)
  const locationCoords = {
    'legion square': [34.0522, -118.2437],
    'vinewood blvd': [34.1015, -118.3261],
    'vespucci beach': [33.9850, -118.4695],
    'rockford hills': [34.0736, -118.4004],
    'downtown': [34.0522, -118.2437],
    'sandy shores': [34.4208, -117.9501],
    'paleto bay': [34.4629, -118.8206],
    'ls airport': [33.9416, -118.4085],
    'del perro': [34.0195, -118.4912],
    'mirror park': [34.0736, -118.1805]
  };

  const getCoordinates = (location) => {
    const lowerLocation = location.toLowerCase();
    for (const [key, coords] of Object.entries(locationCoords)) {
      if (lowerLocation.includes(key)) {
        return coords;
      }
    }
    return null;
  };

  useEffect(() => {
    if (!socket) return;

    // Initial calls
    socket.on('initial-calls', (initialCalls) => {
      setCalls(initialCalls);
    });

    // New call created
    socket.on('call-created', (call) => {
      setCalls(prev => [...prev, call]);
    });

    // Call updated
    socket.on('call-updated', (updatedCall) => {
      setCalls(prev =>
        prev.map(call => call.id === updatedCall.id ? updatedCall : call)
      );
    });

    // All calls cleared
    socket.on('calls-cleared', () => {
      setCalls([]);
      setSelectedLocation(null);
    });

    // Initial messages
    socket.on('initial-messages', (messages) => {
      setChatMessages(messages);
    });

    // New message
    socket.on('new-message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    // Chat cleared
    socket.on('chat-cleared', () => {
      setChatMessages([]);
    });

    // Notification sent confirmation
    socket.on('notification-sent', (data) => {
      alert(`Bildirim gönderildi - ${data.sender}`);
    });

    return () => {
      socket.off('initial-calls');
      socket.off('call-created');
      socket.off('call-updated');
      socket.off('calls-cleared');
      socket.off('initial-messages');
      socket.off('new-message');
      socket.off('chat-cleared');
      socket.off('notification-sent');
    };
  }, [socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleCallClick = (call) => {
    const coords = getCoordinates(call.location);
    if (coords) {
      setMapCenter(coords);
      setSelectedLocation({ coords, call });
    } else {
      alert('Konum haritada bulunamadı');
    }
  };

  const handleMarkReceived = (callId) => {
    socket.emit('mark-call-received', callId);
  };

  const handleClearAllCalls = () => {
    if (window.confirm('Tüm çağrıları temizlemek istediğinizden emin misiniz?')) {
      socket.emit('clear-all-calls');
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Tüm sohbeti temizlemek istediğinizden emin misiniz?')) {
      socket.emit('clear-chat');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    socket.emit('send-message', message);
    setMessage('');
  };

  const handleSendNotification = () => {
    if (window.confirm('Tüm kullanıcılara bildirim göndermek istediğinizden emin misiniz?')) {
      socket.emit('send-notification');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const getPriorityClass = (priority) => {
    if (priority === 'Acil') return 'acil';
    if (priority === 'Öncelikli') return 'oncelikli';
    return 'normal';
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="header-title">OCST DISPATCH CONTROL</h1>
        <div className="header-user">
          <span className="user-badge">{user.username} (DISPATCH)</span>
          <button className="btn-logout" onClick={onLogout}>ÇIKIŞ</button>
        </div>
      </header>

      <div className="dispatch-container">
        {/* Map */}
        <div className="map-container">
          <div className="map-header">
            <span>BÖLGE HARİTASI</span>
          </div>
          <div className="map-content">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <MapController center={mapCenter} zoom={selectedLocation ? 15 : 13} />
              {selectedLocation && (
                <Marker position={selectedLocation.coords}>
                  <Popup>
                    <strong>{selectedLocation.call.title}</strong>
                    <br />
                    {selectedLocation.call.location}
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>

        {/* Calls */}
        <div className="calls-container">
          <div className="calls-header">
            <span>AKTİF ÇAĞRILAR ({calls.length})</span>
            <button className="btn-clear" onClick={handleClearAllCalls}>
              TÜMÜNÜ TEMİZLE
            </button>
          </div>

          <div className="calls-list">
            {calls.length === 0 ? (
              <div className="no-calls">Aktif çağrı bulunmuyor</div>
            ) : (
              calls.map((call) => (
                <div
                  key={call.id}
                  className={`call-item ${call.status === 'received' ? 'received' : ''} ${
                    call.priority === 'Acil' ? 'priority-acil' : ''
                  }`}
                  onClick={() => handleCallClick(call)}
                >
                  <div className="call-header-row">
                    <span className="call-title">{call.title}</span>
                    <span className={`call-priority ${getPriorityClass(call.priority)}`}>
                      {call.priority}
                    </span>
                  </div>
                  
                  <div className="call-info">
                    <strong>Çağıran:</strong> {call.caller}
                  </div>
                  <div className="call-info">
                    <strong>Detay:</strong> {call.details}
                  </div>
                  <div className="call-info">
                    <strong>Konum:</strong> {call.location}
                  </div>
                  <div className="call-info">
                    <strong>Zaman:</strong> {formatTime(call.timestamp)}
                  </div>
                  
                  {call.status === 'received' && (
                    <div className="call-info">
                      <strong>Alındı:</strong> {call.receivedBy}
                    </div>
                  )}

                  <div className="call-actions">
                    {call.status !== 'received' && (
                      <button
                        className="btn-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkReceived(call.id);
                        }}
                      >
                        ALINDI OLARAK İŞARETLE
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="chat-container">
          <div className="chat-header">
            <span>İLETİŞİM</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-notification" onClick={handleSendNotification}>
                BİLDİRİM GÖNDER
              </button>
              <button className="btn-clear" onClick={handleClearChat}>
                TEMİZLE
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {chatMessages.length === 0 ? (
              <div className="no-calls">Henüz mesaj yok</div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className="chat-message">
                  <div className="chat-message-header">
                    <span className="chat-message-user">
                      {msg.username}
                      {msg.deviceType === 'dispatch' && ' (dispatch)'}
                    </span>
                    <span className="chat-message-time">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className="chat-message-text">{msg.message}</div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <form className="chat-input-container" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chat-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mesaj yazın..."
            />
            <button type="submit" className="btn-send">
              GÖNDER
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DispatchView;
