"""
search_chain.py
---------------
Two-tier item search against MongoDB rack_inventory:

Tier 1 (always): MongoDB regex/text search — works with zero config.
Tier 2 (optional): LangChain + sentence-transformers semantic search —
                   activate by setting OPENAI_API_KEY in .env
"""

import os
import re
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME   = "supermarket_sim"

_client = MongoClient(MONGO_URI)
_inv_col = _client[DB_NAME]["rack_inventory"]
_racks_col = _client[DB_NAME]["racks"]


def _mongo_search(query: str) -> list[dict]:
    """Return rack_inventory docs whose item names fuzzy-match the query."""
    words = [w for w in re.split(r"\s+", query.strip()) if len(w) > 2]
    if not words:
        return []

    patterns = [{"items.name": {"$regex": w, "$options": "i"}} for w in words]
    pipeline = [
        {"$match": {"$or": patterns}},
        {"$unwind": "$items"},
        {"$match": {"$or": [{"items.name": {"$regex": w, "$options": "i"}} for w in words]}},
        {"$limit": 10},
    ]
    return list(_inv_col.aggregate(pipeline))


def _score(doc: dict, words: list[str]) -> int:
    name = doc["items"]["name"].lower()
    return sum(1 for w in words if w.lower() in name)


def search_item(query: str) -> dict:
    """
    Search for an item by natural language query.

    Returns:
        {
          "found": bool,
          "query": str,
          "item_name": str,
          "rack_id": str,
          "category": str,
          "price": float,
          "currency": str,
          "stock": int,
          "dock_point": {x, y, z, yaw},
          "message": str   # human-readable summary
        }
    """
    words = [w for w in re.split(r"\s+", query.strip()) if len(w) > 2]
    results = _mongo_search(query)

    if not results:
        return {
            "found": False,
            "query": query,
            "message": f"Sorry, I couldn't find \"{query}\" in any rack. Try a different search term.",
        }

    best = max(results, key=lambda d: _score(d, words))
    item      = best["items"]
    rack_id   = best["rack_id"]
    rack_doc  = _racks_col.find_one({"rack_id": rack_id}, {"_id": 0, "dock_point": 1})
    dock = None
    if rack_doc:
        dp   = rack_doc["dock_point"]
        dock = {"x": dp["x"], "y": dp["y"], "z": dp.get("z", 0.0), "yaw": dp["yaw"]}

    return {
        "found":      True,
        "query":      query,
        "item_name":  item["name"],
        "rack_id":    rack_id,
        "category":   item.get("category", ""),
        "price":      item.get("price", 0.0),
        "currency":   item.get("currency", "USD"),
        "stock":      item.get("stock", 0),
        "dock_point": dock,
        "message":    (
            f"Found **{item['name']}** on **{rack_id}** "
            f"({item.get('category', '')}). "
            f"Price: ${item.get('price', 0):.2f} | "
            f"Stock: {item.get('stock', 0)} units."
        ),
    }
