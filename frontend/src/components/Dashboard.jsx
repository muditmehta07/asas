import { useState, useEffect } from 'react';
import './Dashboard.css';
import CameraFeed from './CameraFeed';
import ShopAssist from './ShopAssist';
import Map from './Map';

const USD_TO_INR = 83.0;

const Dashboard = () => {
    const [navStatus, setNavStatus] = useState('IDLE');
    const [activeTab, setActiveTab] = useState('camera');
    const [detectedItems, setDetectedItems] = useState([]);
    const [currentRack, setCurrentRack] = useState(null);
    const [viewMode, setViewMode] = useState('proximity');
    const [fullInventory, setFullInventory] = useState([]);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch('http://localhost:8000/nav/status');
                if (res.ok) {
                    const data = await res.json();
                    setNavStatus(data.state);
                }
            } catch (err) { }
        };

        const fetchDetectedItems = async () => {
            try {
                const res = await fetch('http://localhost:8000/detected_items');
                if (res.ok) {
                    const data = await res.json();
                    setDetectedItems(data.items || []);
                    setCurrentRack(data.rack_id);
                }
            } catch (err) { }
        };

        const fetchFullInventory = async () => {
            try {
                const res = await fetch('http://localhost:8000/inventory');
                if (res.ok) {
                    const data = await res.json();
                    setFullInventory(data);
                }
            } catch (err) { }
        };

        const statusInterval = setInterval(checkStatus, 2000);
        const itemsInterval = setInterval(fetchDetectedItems, 2000);

        fetchFullInventory();
        const fullInvInterval = setInterval(fetchFullInventory, 10000);

        return () => {
            clearInterval(statusInterval);
            clearInterval(itemsInterval);
            clearInterval(fullInvInterval);
        };
    }, []);

    const handleStop = async () => {
        try {
            await fetch('http://localhost:8000/stop', { method: 'POST' });
        } catch (err) {
            console.error("Failed to stop navigation:", err);
        }
    };

    const handleNavigate = async (rackId, dockPoint) => {
        if (!dockPoint) return;
        try {
            await fetch('http://localhost:8000/navigate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rack_id: rackId,
                    dock_point: dockPoint
                }),
            });
        } catch (err) {
            console.error("Failed to send navigation command:", err);
        }
    };

    const addToCart = (item) => {
        setCart(prev => {
            const exists = prev.find(i => i.name === item.name);
            if (exists) {
                return prev.map(i => i.name === item.name ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...item, qty: 1 }];
        });
    };

    const removeFromCart = (itemName) => {
        setCart(prev => prev.filter(i => i.name !== itemName));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty * USD_TO_INR), 0);

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-title">
                    <h1>Autonomous Shop Assistant</h1>
                </div>
                <div className="header-status-group">
                    <button className={`cart-toggle-btn ${cart.length > 0 ? 'has-items' : ''}`} onClick={() => setIsCartOpen(!isCartOpen)}>
                        <svg className="cart-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        {cart.length > 0 && <span className="cart-badge">{cart.reduce((s, i) => s + i.qty, 0)}</span>}
                    </button>
                    {(navStatus === 'NAVIGATING' || navStatus === 'SENDING') && (
                        <button className="stop-btn" onClick={handleStop}>
                            <span className="stop-icon">■</span> STOP
                        </button>
                    )}
                    <div className="header-status">
                        <div className={`status-dot status-${navStatus}`}></div>
                        {navStatus === 'IDLE' ? 'READY' : navStatus}
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                <div className="visuals-section">
                    <div className="dashboard-card">
                        <div className="tabs-header">
                            <button
                                className={`tab-btn ${activeTab === 'camera' ? 'active' : ''}`}
                                onClick={() => setActiveTab('camera')}
                            >
                                Front Camera
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
                                onClick={() => setActiveTab('map')}
                            >
                                Navigation Map
                            </button>
                        </div>

                        <div className="camera-feed-wrapper">
                            {activeTab === 'camera' ? <CameraFeed /> : <Map />}
                            <div className="feed-overlay"></div>
                        </div>
                    </div>
                </div>

                <div className="controls-section">
                    <div className="dashboard-card detected-items-card">
                        <div className="card-header-with-actions">
                            <h2 className="card-header-text">
                                Inventory
                                {viewMode === 'proximity' && currentRack && <span className="rack-badge">{currentRack}</span>}
                            </h2>
                            <select
                                className="view-toggle-select"
                                value={viewMode}
                                onChange={(e) => setViewMode(e.target.value)}
                            >
                                <option value="proximity">Nearby View</option>
                                <option value="all">All Items View</option>
                            </select>
                        </div>

                        <div className="items-list">
                            {viewMode === 'proximity' ? (
                                detectedItems.length > 0 ? (
                                    detectedItems.map((item, idx) => (
                                        <div key={idx} className="detected-item has-hover-action">
                                            <div className="item-main">
                                                <span className="item-name">{item.name}</span>
                                                <span className="item-category">{item.category}</span>
                                            </div>
                                            <div className="item-side">
                                                <span className="item-price">₹{(item.price * USD_TO_INR).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                                {item.stock < 5 && <span className="low-stock">Low Stock</span>}
                                                <button
                                                    className="add-to-cart-btn"
                                                    onClick={() => addToCart(item)}
                                                >
                                                    + CART
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-items-placeholder">
                                        <div className="radar-icon">📡</div>
                                        <p>No rack detected nearby.</p>
                                        <span>Robot will display items when next to a rack.</span>
                                    </div>
                                )
                            ) : (
                                <div className="full-inventory-list">
                                    {fullInventory.map((rack, rIdx) => (
                                        <div key={rIdx} className="rack-group">
                                            <div className="rack-group-header">
                                                <span className="rack-group-id">{rack.rack_id}</span>
                                                <span className="rack-group-desc">{rack.group} | {rack.zone}</span>
                                            </div>
                                            <div className="rack-group-items">
                                                {rack.items.length > 0 ? rack.items.map((item, iIdx) => (
                                                    <div key={iIdx} className="detected-item mini has-hover-action">
                                                        <div className="item-main">
                                                            <span className="item-name">{item.name}</span>
                                                        </div>
                                                        <div className="item-side">
                                                            <span className="item-price">₹{(item.price * USD_TO_INR).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                                            <div className="item-actions">
                                                                <button
                                                                    className="item-nav-btn"
                                                                    onClick={() => handleNavigate(rack.rack_id, rack.dock_point)}
                                                                    title={`Navigate to ${rack.rack_id}`}
                                                                >
                                                                    NAV
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="empty-rack-msg">No items in this rack.</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="dashboard-card">
                    <h2 className="card-header">Shop Assist AI</h2>
                    <div className="shop-assist-wrapper">
                        <ShopAssist />
                    </div>
                </div>
            </div>

            {/* Cart Drawer */}
            {isCartOpen && (
                <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
                    <div className="cart-drawer" onClick={e => e.stopPropagation()}>
                        <div className="cart-header">
                            <h2>Shopping Cart</h2>
                            <button className="close-cart" onClick={() => setIsCartOpen(false)}>✕</button>
                        </div>

                        <div className="cart-items">
                            {cart.length > 0 ? (
                                cart.map((item, idx) => (
                                    <div key={idx} className="cart-item">
                                        <div className="cart-item-info">
                                            <span className="cart-item-name">{item.name}</span>
                                            <span className="cart-item-price">₹{(item.price * USD_TO_INR).toLocaleString('en-IN', { maximumFractionDigits: 0 })} x {item.qty}</span>
                                        </div>
                                        <button className="remove-item" onClick={() => removeFromCart(item.name)}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-cart-msg">Your cart is empty</div>
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="cart-footer">
                                <div className="cart-total">
                                    <span>Total:</span>
                                    <span>₹{cartTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                </div>
                                <button className="checkout-btn" onClick={() => alert('Proceeding to checkout...')}>
                                    Checkout Now
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
