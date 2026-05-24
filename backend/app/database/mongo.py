from motor.motor_asyncio import AsyncIOMotorClient
import os
import certifi

_client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global _client, db
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/truthlens")
    try:
        if "mongodb+srv" in mongo_uri:
            _client = AsyncIOMotorClient(
                mongo_uri, 
                serverSelectionTimeoutMS=5000, 
                tls=True,
                tlsCAFile=certifi.where(),
            )
        else:
            _client = AsyncIOMotorClient(mongo_uri, serverSelectionTimeoutMS=5000)
        await _client.admin.command("ping")
        db = _client.get_database("truthlens")
        print("[OK] Connected to MongoDB")
    except Exception as e:
        print(f"[WARN] MongoDB connection failed: {e}. Running without database.")
        db = None


async def close_db():
    global _client
    if _client:
        _client.close()


def get_db():
    return db
