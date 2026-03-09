from pymongo import MongoClient
import os

class RackClient:
    def __init__(self, uri=None, db="supermarket_sim", col="racks"):
        uri = uri or os.getenv("MONGO_URI", "mongodb://localhost:27017")
        self._client = MongoClient(uri)
        self._col    = self._client[db][col]

    def get_rack(self, rack_id: str) -> dict | None:
        """Return full rack document by rack_id."""
        return self._col.find_one({"rack_id": rack_id}, {"_id": 0})

    def get_dock_point(self, rack_id: str) -> dict | None:
        """Return only the dock_point sub-document for a rack_id.
        
        Returns dict with keys: x, y, z, yaw  (ready for Nav2 goal)
        """
        doc = self._col.find_one({"rack_id": rack_id}, {"_id": 0, "dock_point": 1})
        if not doc:
            return None
        dp = doc["dock_point"]
        return {"x": dp["x"], "y": dp["y"], "z": dp["z"], "yaw": dp["yaw"]}

    def nearest_rack(self, robot_x: float, robot_y: float,
                     zone: str = None, max_dist: float = 50.0) -> dict | None:
        """Find the nearest rack (by dock point) to the robot's current position.

        Args:
            robot_x, robot_y: robot world coordinates
            zone: optionally filter by 'perimeter' or 'interior'
            max_dist: max search radius in metres
        """
        query = {
            "dock_point.geo": {
                "$nearSphere": {
                    "$geometry": {"type": "Point", "coordinates": [robot_x, robot_y]},
                    "$maxDistance": max_dist
                }
            }
        }
        if zone:
            query["zone"] = zone
        return self._col.find_one(query, {"_id": 0})

    def racks_in_zone(self, zone: str) -> list:
        """Return all racks in a zone ('perimeter' or 'interior')."""
        return list(self._col.find({"zone": zone}, {"_id": 0}))

    def racks_in_group(self, group: str) -> list:
        """Return all racks in a group e.g. 'left_wall', 'central_east_front'."""
        return list(self._col.find({"group": group}, {"_id": 0}))

    def available_racks(self) -> list:
        """Return all racks with status='available'."""
        return list(self._col.find({"status": "available"}, {"_id": 0}))

    def set_status(self, rack_id: str, status: str) -> bool:
        """Set rack status: 'available' | 'occupied' | 'reserved'.
        
        Returns True if document was found and updated.
        """
        result = self._col.update_one(
            {"rack_id": rack_id},
            {"$set": {"status": status}}
        )
        return result.matched_count > 0

    def close(self):
        self._client.close()

def dock_point_to_pose_stamped(dock: dict, frame_id: str = "map"):
    """Convert a dock_point dict to a ROS2 PoseStamped message.

    Args:
        dock:     dict with keys x, y, z, yaw
        frame_id: TF frame (default 'map')

    Returns:
        geometry_msgs.msg.PoseStamped
    
    Usage in your Nav2 node:
        from rack_client import RackClient, dock_point_to_pose_stamped
        from nav2_simple_commander.robot_navigator import BasicNavigator

        navigator = BasicNavigator()
        client    = RackClient()

        dock  = client.get_dock_point("rack_005")
        goal  = dock_point_to_pose_stamped(dock)
        navigator.goToPose(goal)
    """
    import math
    from geometry_msgs.msg import PoseStamped
    from builtin_interfaces.msg import Time
    import rclpy

    msg = PoseStamped()
    msg.header.frame_id = frame_id
    msg.header.stamp    = rclpy.clock.Clock().now().to_msg()

    msg.pose.position.x = dock["x"]
    msg.pose.position.y = dock["y"]
    msg.pose.position.z = dock["z"]

    cy = math.cos(dock["yaw"] * 0.5)
    sy = math.sin(dock["yaw"] * 0.5)
    msg.pose.orientation.w = cy
    msg.pose.orientation.x = 0.0
    msg.pose.orientation.y = 0.0
    msg.pose.orientation.z = sy

    return msg


if __name__ == "__main__":
    import json
    c = RackClient()
    print("rack_005 dock point:", json.dumps(c.get_dock_point("rack_005"), indent=2))
    print("nearest to (0,0):",    json.dumps(c.nearest_rack(0, 0), indent=2))
    c.close()
