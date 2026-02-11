import './Dashboard.css';
import CameraFeed from './CameraFeed';
import ShopAssist from './ShopAssist';
import Map from './Map';

const Dashboard = () => {
    return (
        <div className="dashboard-container">
            <div className="visuals-section">
                <div className="dashboard-card camera-card" style={{ height: '50%' }}>
                    <h2>Camera Feed</h2>
                    <div className="camera-feed-wrapper">
                        <CameraFeed />
                    </div>
                </div>

                <div className="dashboard-card map-card" style={{ height: '50%' }}>
                    <h2>Map</h2>
                    <div className="map-wrapper">
                        <Map />
                    </div>
                </div>
            </div>

            <div className="controls-section">
                <div className="dashboard-card shop-assist-card">
                    <h2>Shop Assist</h2>
                    <div className="shop-assist-wrapper">
                        <ShopAssist />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
