const CameraFeed = () => {
    return (
        <div>
            <img
                src="http://localhost:8080/stream?topic=/camera/image_raw"
                alt="Camera Feed"
            />
        </div>
    );
};

export default CameraFeed;
