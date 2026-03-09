from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
from contextlib import asynccontextmanager

import search_chain
import nav_bridge

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the ROS 2 bridge on startup
    nav_bridge.init()
    yield
    # Cleanup on shutdown
    nav_bridge.shutdown()

app = FastAPI(title="ShopAssist API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    query: str

class NavRequest(BaseModel):
    rack_id: str
    dock_point: dict

@app.post("/search")
async def api_search(req: SearchRequest):
    """
    Takes a natural language query and returns the best matching item
    from the rack_inventory, along with its location (dock_point).
    """
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    log.info(f"Searching for: {req.query}")
    try:
        result = search_chain.search_item(req.query)
        return result
    except Exception as e:
        log.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/navigate")
async def api_navigate(req: NavRequest):
    """
    Triggers the ROS 2 navigation system to drive to a specific rack.
    Non-blocking.
    """
    log.info(f"Navigation requested to {req.rack_id} at {req.dock_point}")
    try:
        result = nav_bridge.navigate_to_dock(req.rack_id, req.dock_point)
        return result
    except Exception as e:
        log.error(f"Nav_bridge error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/nav/status")
async def api_nav_status():
    """Returns the current navigation state (IDLE, SENDING, NAVIGATING, ERROR)."""
    return nav_bridge.get_status()


@app.get("/detected_items")
async def api_detected_items():
    """Returns items of the rack the robot is currently next to."""
    status = nav_bridge.get_status()
    pos = status.get("position", {"x": 0.0, "y": 0.0})
    
    # Try to find a rack within 2.0 meters
    nearest = search_chain.get_nearest_rack(pos["x"], pos["y"], max_dist=2.0)
    
    if nearest:
        items = search_chain.get_rack_items(nearest["rack_id"])
        return {
            "rack_id": nearest["rack_id"],
            "items": items,
            "position": pos
        }
    
    return {
        "rack_id": None,
        "items": [],
        "position": pos
    }


@app.post("/stop")
async def api_stop():
    """Immediately stops the robot by canceling the current Nav2 goal."""
    return nav_bridge.stop_navigation()


@app.get("/inventory")
async def api_inventory():
    """Returns the entire store inventory grouped by rack."""
    return search_chain.get_all_inventory()

