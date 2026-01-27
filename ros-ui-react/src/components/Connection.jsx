import React, { useEffect, useState } from 'react';
import ROSLIB from 'roslib';

const Connection = ({ url = 'ws://localhost:9090' }) => {
    const [connected, setConnected] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        let ros;
        try {
            ros = new ROSLIB.Ros({
                url: url
            });

            ros.on('connection', () => {
                console.log('Connected to websocket server.');
                setConnected(true);
                setErrorMsg('');
            });

            ros.on('error', (error) => {
                console.log('Error connecting to websocket server: ', error);
                setConnected(false);
                // setErrorMsg('Connection Error'); 
            });

            ros.on('close', () => {
                console.log('Connection to websocket server closed.');
                setConnected(false);
                setErrorMsg('Connection Closed');
            });
        } catch (err) {
            console.error("Failed to initialize ROSLIB:", err);
        }

        return () => {
            if (ros) {
                ros.close();
            }
        };
    }, [url]);

    return (
        <div style={{
            position: 'absolute',
            top: '1.5rem',
            right: '2rem',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '0.5rem 1rem',
            borderRadius: '9999px', // pill shape
            backdropFilter: 'blur(8px)',
            border: `1px solid ${connected ? 'rgba(74, 222, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 1000
        }}>
            <div className={`status-indicator ${connected ? 'status-connected' : 'status-disconnected'}`}></div>
            <span style={{
                fontSize: '0.85em',
                fontWeight: 600,
                color: connected ? '#bbf7d0' : '#fecaca',
                letterSpacing: '0.025em'
            }}>
                {connected ? 'ROS ONLINE' : 'ROS OFFLINE'}
            </span>
        </div>
    );
};

export default Connection;
