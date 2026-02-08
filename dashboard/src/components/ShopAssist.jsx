const ShopAssist = () => {
    return (
        <>
            <div className="messages-container">
                {/* Messages will appear here */}
            </div>
            <div className="input-container">
                <div className="input-wrapper">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Message Shop Assist..."
                    />
                    <button className="send-button" onClick={() => console.log('Message sent')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M7 11L12 6L17 11M12 18V7"
                                stroke="#ffffff"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </>
    );
};

export default ShopAssist;
