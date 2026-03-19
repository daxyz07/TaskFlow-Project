from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import os
import logging
from pathlib import Path
import shutil
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: EmailStr
    name: str
    role: str
    avatar: Optional[str] = None
    created_at: datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "member"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    assignee_id: Optional[str] = None
    reporter_id: str
    due_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    tags: List[str] = []
    images: List[str] = []

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    assignee_id: Optional[str] = None
    due_date: Optional[datetime] = None
    tags: List[str] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[str] = None
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None

class Comment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    task_id: str
    user_id: str
    content: str
    images: List[str] = []
    created_at: datetime

class CommentCreate(BaseModel):
    task_id: str
    content: str
    images: List[str] = []

class Meeting(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: Optional[str] = None
    datetime: datetime
    attendees: List[str] = []
    status: str = "scheduled"
    created_at: datetime

class MeetingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    datetime: datetime
    attendees: List[str] = []

class Approval(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    task_id: str
    requester_id: str
    approver_id: str
    status: str = "pending"
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class ApprovalCreate(BaseModel):
    task_id: str
    approver_id: str
    description: Optional[str] = None

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    message: str
    type: str
    read: bool = False
    created_at: datetime

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/auth/signup")
async def signup(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role,
        "avatar": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_access_token({"sub": user_id})
    user_response = User(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        created_at=datetime.now(timezone.utc)
    )
    return {"token": token, "user": user_response}

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["id"]})
    user["created_at"] = datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
    user_response = User(**user)
    return {"token": token, "user": user_response}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    for user in users:
        if isinstance(user["created_at"], str):
            user["created_at"] = datetime.fromisoformat(user["created_at"])
    return [User(**user) for user in users]

@api_router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update roles")
    
    result = await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True}

@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate, current_user: User = Depends(get_current_user)):
    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    task_doc = {
        "id": task_id,
        "title": task_data.title,
        "description": task_data.description,
        "status": task_data.status,
        "priority": task_data.priority,
        "assignee_id": task_data.assignee_id,
        "reporter_id": current_user.id,
        "due_date": task_data.due_date.isoformat() if task_data.due_date else None,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "tags": task_data.tags,
        "images": []
    }
    await db.tasks.insert_one(task_doc)
    
    if task_data.assignee_id and task_data.assignee_id != current_user.id:
        notif_id = str(uuid.uuid4())
        await db.notifications.insert_one({
            "id": notif_id,
            "user_id": task_data.assignee_id,
            "message": f"{current_user.name} assigned you a task: {task_data.title}",
            "type": "task_assigned",
            "read": False,
            "created_at": now.isoformat()
        })
    
    task_doc["created_at"] = now
    task_doc["updated_at"] = now
    if task_doc["due_date"]:
        task_doc["due_date"] = datetime.fromisoformat(task_doc["due_date"])
    return Task(**task_doc)

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(current_user: User = Depends(get_current_user)):
    tasks = await db.tasks.find({}, {"_id": 0}).to_list(1000)
    for task in tasks:
        if isinstance(task["created_at"], str):
            task["created_at"] = datetime.fromisoformat(task["created_at"])
        if isinstance(task["updated_at"], str):
            task["updated_at"] = datetime.fromisoformat(task["updated_at"])
        if task.get("due_date") and isinstance(task["due_date"], str):
            task["due_date"] = datetime.fromisoformat(task["due_date"])
    return [Task(**task) for task in tasks]

@api_router.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str, current_user: User = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if isinstance(task["created_at"], str):
        task["created_at"] = datetime.fromisoformat(task["created_at"])
    if isinstance(task["updated_at"], str):
        task["updated_at"] = datetime.fromisoformat(task["updated_at"])
    if task.get("due_date") and isinstance(task["due_date"], str):
        task["due_date"] = datetime.fromisoformat(task["due_date"])
    return Task(**task)

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task_data: TaskUpdate, current_user: User = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task_data.status and current_user.role == "member" and task["assignee_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Members can only change status of their own tasks")
    
    if task_data.assignee_id and current_user.role == "member":
        raise HTTPException(status_code=403, detail="Members cannot reassign tasks")
    
    update_dict = {k: v for k, v in task_data.model_dump(exclude_unset=True).items() if v is not None}
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        if "due_date" in update_dict and update_dict["due_date"]:
            update_dict["due_date"] = update_dict["due_date"].isoformat()
        await db.tasks.update_one({"id": task_id}, {"$set": update_dict})
    
    updated_task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if isinstance(updated_task["created_at"], str):
        updated_task["created_at"] = datetime.fromisoformat(updated_task["created_at"])
    if isinstance(updated_task["updated_at"], str):
        updated_task["updated_at"] = datetime.fromisoformat(updated_task["updated_at"])
    if updated_task.get("due_date") and isinstance(updated_task["due_date"], str):
        updated_task["due_date"] = datetime.fromisoformat(updated_task["due_date"])
    return Task(**updated_task)

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Only admins and managers can delete tasks")
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.comments.delete_many({"task_id": task_id})
    return {"success": True}

@api_router.post("/comments", response_model=Comment)
async def create_comment(comment_data: CommentCreate, current_user: User = Depends(get_current_user)):
    comment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    comment_doc = {
        "id": comment_id,
        "task_id": comment_data.task_id,
        "user_id": current_user.id,
        "content": comment_data.content,
        "images": comment_data.images,
        "created_at": now.isoformat()
    }
    await db.comments.insert_one(comment_doc)
    comment_doc["created_at"] = now
    return Comment(**comment_doc)

@api_router.get("/comments/{task_id}", response_model=List[Comment])
async def get_comments(task_id: str, current_user: User = Depends(get_current_user)):
    comments = await db.comments.find({"task_id": task_id}, {"_id": 0}).to_list(1000)
    for comment in comments:
        if isinstance(comment["created_at"], str):
            comment["created_at"] = datetime.fromisoformat(comment["created_at"])
    return [Comment(**comment) for comment in comments]

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    file_ext = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = UPLOAD_DIR / file_name
    
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"filename": file_name, "url": f"/api/uploads/{file_name}"}

@api_router.post("/meetings", response_model=Meeting)
async def create_meeting(meeting_data: MeetingCreate, current_user: User = Depends(get_current_user)):
    meeting_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    meeting_doc = {
        "id": meeting_id,
        "title": meeting_data.title,
        "description": meeting_data.description,
        "datetime": meeting_data.datetime.isoformat(),
        "attendees": meeting_data.attendees,
        "status": "scheduled",
        "created_at": now.isoformat()
    }
    await db.meetings.insert_one(meeting_doc)
    meeting_doc["created_at"] = now
    meeting_doc["datetime"] = meeting_data.datetime
    return Meeting(**meeting_doc)

@api_router.get("/meetings", response_model=List[Meeting])
async def get_meetings(current_user: User = Depends(get_current_user)):
    meetings = await db.meetings.find({}, {"_id": 0}).to_list(1000)
    for meeting in meetings:
        if isinstance(meeting["created_at"], str):
            meeting["created_at"] = datetime.fromisoformat(meeting["created_at"])
        if isinstance(meeting["datetime"], str):
            meeting["datetime"] = datetime.fromisoformat(meeting["datetime"])
    return [Meeting(**meeting) for meeting in meetings]

@api_router.post("/approvals", response_model=Approval)
async def create_approval(approval_data: ApprovalCreate, current_user: User = Depends(get_current_user)):
    approval_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    approval_doc = {
        "id": approval_id,
        "task_id": approval_data.task_id,
        "requester_id": current_user.id,
        "approver_id": approval_data.approver_id,
        "status": "pending",
        "description": approval_data.description,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    await db.approvals.insert_one(approval_doc)
    
    notif_id = str(uuid.uuid4())
    await db.notifications.insert_one({
        "id": notif_id,
        "user_id": approval_data.approver_id,
        "message": f"{current_user.name} requested your approval",
        "type": "approval_request",
        "read": False,
        "created_at": now.isoformat()
    })
    
    approval_doc["created_at"] = now
    approval_doc["updated_at"] = now
    return Approval(**approval_doc)

@api_router.get("/approvals", response_model=List[Approval])
async def get_approvals(current_user: User = Depends(get_current_user)):
    approvals = await db.approvals.find({}, {"_id": 0}).to_list(1000)
    for approval in approvals:
        if isinstance(approval["created_at"], str):
            approval["created_at"] = datetime.fromisoformat(approval["created_at"])
        if isinstance(approval["updated_at"], str):
            approval["updated_at"] = datetime.fromisoformat(approval["updated_at"])
    return [Approval(**approval) for approval in approvals]

@api_router.put("/approvals/{approval_id}")
async def update_approval(approval_id: str, status: str, current_user: User = Depends(get_current_user)):
    approval = await db.approvals.find_one({"id": approval_id}, {"_id": 0})
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    
    if approval["approver_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the approver can update this")
    
    now = datetime.now(timezone.utc)
    await db.approvals.update_one({"id": approval_id}, {"$set": {"status": status, "updated_at": now.isoformat()}})
    
    notif_id = str(uuid.uuid4())
    await db.notifications.insert_one({
        "id": notif_id,
        "user_id": approval["requester_id"],
        "message": f"Your approval request was {status}",
        "type": "approval_response",
        "read": False,
        "created_at": now.isoformat()
    })
    
    return {"success": True}

@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": current_user.id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for notif in notifications:
        if isinstance(notif["created_at"], str):
            notif["created_at"] = datetime.fromisoformat(notif["created_at"])
    return [Notification(**notif) for notif in notifications]

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: User = Depends(get_current_user)):
    result = await db.notifications.update_one({"id": notification_id, "user_id": current_user.id}, {"$set": {"read": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}

@api_router.get("/stats")
async def get_stats(current_user: User = Depends(get_current_user)):
    total_tasks = await db.tasks.count_documents({})
    my_tasks = await db.tasks.count_documents({"assignee_id": current_user.id})
    completed_tasks = await db.tasks.count_documents({"status": "done"})
    pending_approvals = await db.approvals.count_documents({"approver_id": current_user.id, "status": "pending"})
    
    task_by_status = {}
    for status in ["todo", "in_progress", "review", "done"]:
        count = await db.tasks.count_documents({"status": status})
        task_by_status[status] = count
    
    return {
        "total_tasks": total_tasks,
        "my_tasks": my_tasks,
        "completed_tasks": completed_tasks,
        "pending_approvals": pending_approvals,
        "task_by_status": task_by_status
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()