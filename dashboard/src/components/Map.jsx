import React, { useEffect, useRef, useState } from 'react';
import * as ROSLIB from 'roslib';
import './Map.css';

const Map = () => {
    const canvasRef = useRef(null);
    const [robotPose, setRobotPose] = useState({ x: 0, y: 0, theta: 0 });
    const [mapLoaded, setMapLoaded] = useState(false);
    const [rosConnected, setRosConnected] = useState(false);
    const mapImageRef = useRef(null);
    const rosRef = useRef(null);

    // Map metadata from my_map.yaml
    const mapMetadata = {
        resolution: 0.05,  // meters per pixel
        origin: { x: -9.72, y: -11, z: 0 },  // origin position
        width: 609,   // from the saved map
        height: 581   // from the saved map
    };

    const quaternionToYaw = (q) => {
        const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
        const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
        return Math.atan2(siny_cosp, cosy_cosp);
    };


    useEffect(() => {
        // Load the map image
        const img = new Image();
        img.onload = () => {
            mapImageRef.current = img;
            setMapLoaded(true);
        };
        img.src = '/my_map.png';

        // Connect to ROS
        const ros = new ROSLIB.Ros({
            url: 'ws://localhost:9090'
        });

        ros.on('connection', () => {
            console.log('Connected to ROS bridge');
            setRosConnected(true);
        });

        ros.on('error', (error) => {
            console.log('Error connecting to ROS bridge:', error);
            setRosConnected(false);
        });

        ros.on('close', () => {
            console.log('Connection to ROS bridge closed');
            setRosConnected(false);
        });

        rosRef.current = ros;

        // Subscribe to TF topic
        const poseTopic = new ROSLIB.Topic({
            ros: ros,
            name: '/pose',
            messageType: 'geometry_msgs/PoseWithCovarianceStamped'
        });

        poseTopic.subscribe((message) => {
            const position = message.pose.pose.position;
            const orientation = message.pose.pose.orientation;

            const yaw = quaternionToYaw(orientation);

            setRobotPose({
                x: position.x,
                y: position.y,
                theta: yaw
            });
        });


        return () => {
            poseTopic.unsubscribe();
            ros.close();
        };
    }, []);

    useEffect(() => {
        if (!mapLoaded || !canvasRef.current || !mapImageRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the map
        ctx.drawImage(mapImageRef.current, 0, 0, canvas.width, canvas.height);

        // Convert robot world coordinates to pixel coordinates
        const pixelX = (robotPose.x - mapMetadata.origin.x) / mapMetadata.resolution;
        const pixelY = mapMetadata.height - (robotPose.y - mapMetadata.origin.y) / mapMetadata.resolution;

        // Draw robot position
        ctx.save();
        ctx.translate(pixelX, pixelY);
        ctx.rotate(-robotPose.theta); // Negative because canvas Y is inverted

        // Draw robot as a triangle pointing in the direction it's facing
        ctx.fillStyle = '#FF4444';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(15, 0);      // Front point
        ctx.lineTo(-10, -10);   // Back left
        ctx.lineTo(-10, 10);    // Back right
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw a circle at the center
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();

        // Draw position info
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.font = '14px Arial';
        const posText = `X: ${robotPose.x.toFixed(2)}m  Y: ${robotPose.y.toFixed(2)}m  θ: ${(robotPose.theta * 180 / Math.PI).toFixed(1)}°`;
        ctx.strokeText(posText, 10, 20);
        ctx.fillText(posText, 10, 20);

        // Draw connection status
        const statusText = rosConnected ? '🟢 Connected' : '🔴 Disconnected';
        ctx.strokeText(statusText, 10, 40);
        ctx.fillText(statusText, 10, 40);

    }, [mapLoaded, robotPose, rosConnected]);

    return (
        <div className="map-container">
            {!mapLoaded && (
                <div className="map-loading">
                    <p>Loading map...</p>
                </div>
            )}
            <canvas
                ref={canvasRef}
                width={mapMetadata.width}
                height={mapMetadata.height}
                className="map-canvas"
            />
        </div>
    );
};

export default Map;
