import { useState, useEffect } from 'react';
import './Dashboard.css';
import CameraFeed from './CameraFeed';
import ShopAssist from './ShopAssist';
import Map from './Map';

const Dashboard = () => {
    const [navStatus, setNavStatus] = useState('IDLE');

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch('http://localhost:8000/nav/status');
                if (res.ok) {
                    const data = await res.json();
                    setNavStatus(data.state);
                }
            } catch (err) {
                // Ignore fetch errors during dev if backend is down
            }
        };

        const interval = setInterval(checkStatus, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-title">
                    <h1>Autonomous Shop Assistant</h1>
                </div>
                <div className="header-status">
                    <div className={`status-dot status-${navStatus}`}></div>
                    {navStatus === 'IDLE' ? 'READY' : navStatus}
                </div>
            </header>

            <div className="dashboard-content">
                <div className="visuals-section">
                    <div className="dashboard-card">
                        <h2>Front Camera</h2>
                        <div className="camera-feed-wrapper">
                            <CameraFeed />
                            <div className="feed-overlay"></div>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h2>Navigation Map</h2>
                        <div className="camera-feed-wrapper">
                            <Map />
                            <div className="feed-overlay"></div>
                        </div>
                    </div>
                </div>

                <div className="controls-section">
                    <div className="dashboard-card">
                        <h2>Shop Assist AI</h2>
                        <div className="shop-assist-wrapper">
                            <ShopAssist />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
