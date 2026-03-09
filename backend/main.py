from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

from search_chain import search_item
import nav_bridge

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

app = FastAPI(title="ShopAssist API")

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
        result = search_item(req.query)
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

