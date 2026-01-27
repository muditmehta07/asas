import React, { useState } from 'react';

const RobotCamera = ({ topic = '/camera/image_raw', host = 'localhost', port = 8080 }) => {
    const url = `http://${host}:${port}/stream?topic=${topic}`;
    const [error, setError] = useState(false);

    // Retry logic could be added here, currently just shows error on fail

    return (
        <div className="card">
            <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span role="img" aria-label="camera">📷</span> Robot Camera Feed
            </h2>
            <div className="camera-container">
                {!error ? (
                    <img
                        src={url}
                        alt={`Stream from ${topic}`}
                        className="camera-feed"
                        onError={() => setError(true)}
                    />
                ) : (
                    <div className="placeholder-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <p>🚫 Stream unavailable</p>
                        <p style={{ fontSize: '0.8em', marginTop: '0.5em', opacity: 0.7 }}>
                            Ensure <code>web_video_server</code> is running on port {port}.
                        </p>
                        <button
                            onClick={() => setError(false)}
                            style={{ marginTop: '1rem', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                        >
                            Retry
                        </button>
                    </div>
                )}
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.85em', color: '#64748b', textAlign: 'center' }}>
                <code>{topic}</code>
            </div>
        </div>
    );
};

export default RobotCamera;
