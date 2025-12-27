from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

from api import projects, tests, devices, ai, websocket, inspector, realtime, flows, playback, appium_server, installed_apps, check_apk, element_inspector, codegen, code_editor, web_automation, web_routes, enhanced_actions
from database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GravityQA API",
    description="AI-Native Test Automation Platform API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(tests.router, prefix="/api/tests", tags=["tests"])
app.include_router(devices.router, prefix="/api/devices", tags=["devices"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(inspector.router)
app.include_router(element_inspector.router)  # Element Inspector
app.include_router(codegen.router)  # Code Generator
app.include_router(code_editor.router)  # Code Editor
app.include_router(realtime.router)
app.include_router(flows.router)
app.include_router(playback.router)
app.include_router(appium_server.router)
app.include_router(installed_apps.router)
app.include_router(check_apk.router)
app.include_router(web_automation.router)  # Web Automation (Playwright)
app.include_router(web_routes.router)  # Web Automation (Selenium)
app.include_router(enhanced_actions.router)  # Enhanced Actions (Type, Wait, Assert)
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])

@app.get("/")
async def root():
    return {
        "name": "GravityQA API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
