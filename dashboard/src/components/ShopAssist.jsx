import { useState, useRef, useEffect } from 'react';

const ShopAssist = () => {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hello! What are you looking for today?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSearch = async () => {
        if (!query.trim()) return;

        const userMsg = query.trim();
        setQuery('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            const res = await fetch('http://localhost:8000/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMsg }),
            });

            if (!res.ok) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    text: 'Sorry, I am having trouble connecting to the database right now.'
                }]);
                return;
            }

            const data = await res.json();

            setMessages(prev => [...prev, {
                role: 'assistant',
                text: data.message,
                itemData: data.found ? data : null
            }]);

        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: 'Connection error. Make sure the backend server is running.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNavigate = async (itemData) => {
        try {
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: `Navigating to ${itemData.rack_id}...`
            }]);

            await fetch('http://localhost:8000/navigate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rack_id: itemData.rack_id,
                    dock_point: itemData.dock_point
                }),
            });
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: 'Failed to send navigation command.'
            }]);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Chat Messages Area */}
            <div className="messages-container" style={{ flex: 1, overflowY: 'auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        <div style={{
                            background: msg.role === 'user' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                            color: 'var(--text-primary)',
                            padding: '12px 16px',
                            borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                            border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
                            fontSize: '0.95rem',
                            lineHeight: '1.4'
                        }}>
                            {/* Simple markdown bolding for the text */}
                            <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></span>
                        </div>

                        {/* Item Card (if found) */}
                        {msg.itemData && (
                            <div style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '12px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                marginTop: '4px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        {msg.itemData.category}
                                    </span>
                                    <span style={{ background: 'var(--success)', color: '#000', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
                                        {msg.itemData.stock} in stock
                                    </span>
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{msg.itemData.item_name}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                    <span style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                                        ${msg.itemData.price.toFixed(2)}
                                    </span>
                                    <button
                                        onClick={() => handleNavigate(msg.itemData)}
                                        style={{
                                            background: 'var(--accent-color)',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            transition: 'transform 0.1s'
                                        }}
                                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        Navigate <span>→</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '16px 16px 16px 0', border: '1px solid var(--glass-border)' }}>
                        <span style={{ display: 'inline-flex', gap: '4px' }}>
                            <span style={{ animation: 'bounce 1.4s infinite ease-in-out both' }}>.</span>
                            <span style={{ animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.16s' }}>.</span>
                            <span style={{ animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.32s' }}>.</span>
                        </span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="input-container" style={{ padding: '20px', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)' }}>
                <div className="input-wrapper" style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '24px',
                    padding: '4px 8px 4px 20px',
                    alignItems: 'center'
                }}>
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Search for an item (e.g. 'brown woven sweater')..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            fontSize: '0.95rem',
                            padding: '12px 0'
                        }}
                    />
                    <button
                        className="send-button"
                        onClick={handleSearch}
                        disabled={isLoading || !query.trim()}
                        style={{
                            background: query.trim() ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            border: 'none',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: query.trim() ? 'pointer' : 'default',
                            transition: 'all 0.2s'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes bounce {
                    0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
                    40% { transform: translateY(-4px); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ShopAssist;
