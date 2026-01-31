import React, { useState, useEffect, useRef } from 'react';

const MobileView = ({ user, socket, onLogout }) => {
  const [callTitle, setCallTitle] = useState('');
  const [callDetails, setCallDetails] = useState('');
  const [callLocation, setCallLocation] = useState('');
  const [callPriority, setCallPriority] = useState('Acil değil');
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

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

    return () => {
      socket.off('initial-messages');
      socket.off('new-message');
      socket.off('chat-cleared');
    };
  }, [socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmitCall = (e) => {
    e.preventDefault();

    if (!callTitle || !callDetails || !callLocation) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    socket.emit('new-call', {
      title: callTitle,
      details: callDetails,
      location: callLocation,
      priority: callPriority
    });

    // Clear form
    setCallTitle('');
    setCallDetails('');
    setCallLocation('');
    setCallPriority('Acil değil');

    // Show success message
    setSuccessMessage('Çağrı başarıyla gönderildi');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    socket.emit('send-message', message);
    setMessage('');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="header-title">OCST DISPATCH</h1>
        <div className="header-user">
          <span className="user-badge">{user.username}</span>
          <button className="btn-logout" onClick={onLogout}>ÇIKIŞ</button>
        </div>
      </header>

      <div className="mobile-container">
        {/* Call Form */}
        <form className="call-form" onSubmit={handleSubmitCall}>
          <h2 className="form-section-title">Yeni Çağrı Oluştur</h2>

          <div className="form-group">
            <label className="form-label">Çağrı Başlığı</label>
            <input
              type="text"
              className="form-input"
              value={callTitle}
              onChange={(e) => setCallTitle(e.target.value)}
              placeholder="Çağrı başlığını girin"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Çağrı Detayı</label>
            <textarea
              className="form-textarea"
              value={callDetails}
              onChange={(e) => setCallDetails(e.target.value)}
              placeholder="Çağrı detaylarını girin"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Konum</label>
            <input
              type="text"
              className="form-input"
              value={callLocation}
              onChange={(e) => setCallLocation(e.target.value)}
              placeholder="Konum bilgisi (örn: Legion Square, Vinewood Blvd)"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Aciliyet Durumu</label>
            <select
              className="form-select"
              value={callPriority}
              onChange={(e) => setCallPriority(e.target.value)}
            >
              <option value="Acil değil">Acil değil</option>
              <option value="Öncelikli">Öncelikli</option>
              <option value="Acil">Acil</option>
            </select>
          </div>

          <button type="submit" className="btn btn-submit">
            ÇAĞRI GÖNDER
          </button>

          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}
        </form>

        {/* Chat */}
        <div className="chat-container">
          <div className="chat-header">
            <span>ANLIK İLETİŞİM</span>
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

export default MobileView;