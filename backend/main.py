#!/usr/bin/env python3
"""
Karada Python Backend - Main Entry Point
FastAPI server with LND integration for HODL invoice escrow.
"""

import os
import uvicorn
from app.api import app

if __name__ == "__main__":
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    
    print(f"Starting Karada Python Backend on {host}:{port}")
    print(f"LND REST Host: {os.getenv('LND_REST_HOST', 'https://localhost:8082')}")
    print(f"Database: {os.getenv('DATABASE_URL', 'sqlite:///./karada.db')}")
    
    uvicorn.run("app.api:app", host=host, port=port, reload=True)