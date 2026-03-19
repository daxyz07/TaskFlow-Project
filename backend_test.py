import requests
import sys
from datetime import datetime, timezone, timedelta
import json

class TaskFlowAPITester:
    def __init__(self, base_url="https://collab-kanban-6.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.manager_token = None
        self.member_token = None
        self.admin_user = None
        self.manager_user = None
        self.member_user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_task_id = None
        self.created_meeting_id = None
        self.created_approval_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.text}")
                except:
                    pass
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_signup(self):
        """Test user signup for different roles"""
        print("\n=== Testing Authentication - Signup ===")
        
        # Test admin signup
        admin_data = {
            "email": f"admin_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "AdminPass123!",
            "name": "Test Admin",
            "role": "admin"
        }
        success, response = self.run_test("Admin Signup", "POST", "auth/signup", 200, admin_data)
        if success and 'token' in response:
            self.admin_token = response['token']
            self.admin_user = response['user']
            print(f"Admin created: {self.admin_user['email']}")
        
        # Test manager signup
        manager_data = {
            "email": f"manager_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "ManagerPass123!",
            "name": "Test Manager",
            "role": "manager"
        }
        success, response = self.run_test("Manager Signup", "POST", "auth/signup", 200, manager_data)
        if success and 'token' in response:
            self.manager_token = response['token']
            self.manager_user = response['user']
            print(f"Manager created: {self.manager_user['email']}")
        
        # Test member signup
        member_data = {
            "email": f"member_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "MemberPass123!",
            "name": "Test Member",
            "role": "member"
        }
        success, response = self.run_test("Member Signup", "POST", "auth/signup", 200, member_data)
        if success and 'token' in response:
            self.member_token = response['token']
            self.member_user = response['user']
            print(f"Member created: {self.member_user['email']}")

    def test_auth_login(self):
        """Test user login"""
        print("\n=== Testing Authentication - Login ===")
        
        if self.admin_user:
            login_data = {
                "email": self.admin_user['email'],
                "password": "AdminPass123!"
            }
            success, response = self.run_test("Admin Login", "POST", "auth/login", 200, login_data)
            if success and 'token' in response:
                print("Admin login successful")

    def test_auth_me(self):
        """Test get current user"""
        print("\n=== Testing Authentication - Get Me ===")
        
        if self.admin_token:
            success, response = self.run_test("Get Current User", "GET", "auth/me", 200, token=self.admin_token)
            if success:
                print(f"Current user: {response.get('name', 'Unknown')}")

    def test_users_endpoints(self):
        """Test user management endpoints"""
        print("\n=== Testing User Management ===")
        
        if self.admin_token:
            # Get all users
            success, response = self.run_test("Get All Users", "GET", "users", 200, token=self.admin_token)
            if success:
                print(f"Found {len(response)} users")
            
            # Test role update (admin only)
            if self.member_user:
                success, response = self.run_test("Update User Role", "PUT", f"users/{self.member_user['id']}/role?role=manager", 200, token=self.admin_token)

    def test_tasks_endpoints(self):
        """Test task management endpoints"""
        print("\n=== Testing Task Management ===")
        
        if self.admin_token:
            # Create a task
            task_data = {
                "title": "Test Task",
                "description": "This is a test task",
                "status": "todo",
                "priority": "high",
                "assignee_id": self.member_user['id'] if self.member_user else None,
                "tags": ["testing", "api"]
            }
            success, response = self.run_test("Create Task", "POST", "tasks", 200, task_data, token=self.admin_token)
            if success and 'id' in response:
                self.created_task_id = response['id']
                print(f"Task created with ID: {self.created_task_id}")
            
            # Get all tasks
            success, response = self.run_test("Get All Tasks", "GET", "tasks", 200, token=self.admin_token)
            if success:
                print(f"Found {len(response)} tasks")
            
            # Get specific task
            if self.created_task_id:
                success, response = self.run_test("Get Specific Task", "GET", f"tasks/{self.created_task_id}", 200, token=self.admin_token)
            
            # Update task
            if self.created_task_id:
                update_data = {
                    "status": "in_progress",
                    "priority": "medium"
                }
                success, response = self.run_test("Update Task", "PUT", f"tasks/{self.created_task_id}", 200, update_data, token=self.admin_token)
            
            # Test role-based permissions - member trying to reassign task
            if self.created_task_id and self.member_token:
                update_data = {"assignee_id": self.admin_user['id']}
                success, response = self.run_test("Member Reassign Task (Should Fail)", "PUT", f"tasks/{self.created_task_id}", 403, update_data, token=self.member_token)

    def test_comments_endpoints(self):
        """Test comment endpoints"""
        print("\n=== Testing Comments ===")
        
        if self.created_task_id and self.admin_token:
            # Create comment
            comment_data = {
                "task_id": self.created_task_id,
                "content": "This is a test comment"
            }
            success, response = self.run_test("Create Comment", "POST", "comments", 200, comment_data, token=self.admin_token)
            
            # Get comments for task
            success, response = self.run_test("Get Task Comments", "GET", f"comments/{self.created_task_id}", 200, token=self.admin_token)
            if success:
                print(f"Found {len(response)} comments")

    def test_meetings_endpoints(self):
        """Test meeting endpoints"""
        print("\n=== Testing Meetings ===")
        
        if self.admin_token:
            # Create meeting
            future_date = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
            meeting_data = {
                "title": "Test Meeting",
                "description": "This is a test meeting",
                "datetime": future_date,
                "attendees": [self.admin_user['id'], self.member_user['id']] if self.member_user else [self.admin_user['id']]
            }
            success, response = self.run_test("Create Meeting", "POST", "meetings", 200, meeting_data, token=self.admin_token)
            if success and 'id' in response:
                self.created_meeting_id = response['id']
                print(f"Meeting created with ID: {self.created_meeting_id}")
            
            # Get all meetings
            success, response = self.run_test("Get All Meetings", "GET", "meetings", 200, token=self.admin_token)
            if success:
                print(f"Found {len(response)} meetings")

    def test_approvals_endpoints(self):
        """Test approval endpoints"""
        print("\n=== Testing Approvals ===")
        
        if self.created_task_id and self.admin_token and self.manager_token:
            # Create approval request
            approval_data = {
                "task_id": self.created_task_id,
                "approver_id": self.manager_user['id'],
                "description": "Please approve this task"
            }
            success, response = self.run_test("Create Approval", "POST", "approvals", 200, approval_data, token=self.admin_token)
            if success and 'id' in response:
                self.created_approval_id = response['id']
                print(f"Approval created with ID: {self.created_approval_id}")
            
            # Get all approvals
            success, response = self.run_test("Get All Approvals", "GET", "approvals", 200, token=self.admin_token)
            if success:
                print(f"Found {len(response)} approvals")
            
            # Update approval (approve it)
            if self.created_approval_id:
                success, response = self.run_test("Approve Request", "PUT", f"approvals/{self.created_approval_id}?status=approved", 200, token=self.manager_token)

    def test_notifications_endpoints(self):
        """Test notification endpoints"""
        print("\n=== Testing Notifications ===")
        
        if self.member_token:
            # Get notifications (should have some from task assignment and approval)
            success, response = self.run_test("Get Notifications", "GET", "notifications", 200, token=self.member_token)
            if success:
                print(f"Found {len(response)} notifications")
                
                # Mark first notification as read if exists
                if response and len(response) > 0:
                    notif_id = response[0]['id']
                    success, _ = self.run_test("Mark Notification Read", "PUT", f"notifications/{notif_id}/read", 200, token=self.member_token)

    def test_stats_endpoint(self):
        """Test stats endpoint"""
        print("\n=== Testing Stats ===")
        
        if self.admin_token:
            success, response = self.run_test("Get Stats", "GET", "stats", 200, token=self.admin_token)
            if success:
                print(f"Stats: Total Tasks: {response.get('total_tasks', 0)}, My Tasks: {response.get('my_tasks', 0)}")
                print(f"Completed: {response.get('completed_tasks', 0)}, Pending Approvals: {response.get('pending_approvals', 0)}")

    def test_delete_operations(self):
        """Test delete operations (admin/manager only)"""
        print("\n=== Testing Delete Operations ===")
        
        if self.created_task_id and self.admin_token:
            # Test delete task (admin should be able to)
            success, response = self.run_test("Delete Task (Admin)", "DELETE", f"tasks/{self.created_task_id}", 200, token=self.admin_token)
            
            # Test member trying to delete (should fail)
            if self.member_token:
                success, response = self.run_test("Delete Task (Member - Should Fail)", "DELETE", f"tasks/{self.created_task_id}", 403, token=self.member_token)

def main():
    print("🚀 Starting TaskFlow API Comprehensive Testing")
    print("=" * 60)
    
    tester = TaskFlowAPITester()
    
    # Run all tests in sequence
    try:
        tester.test_auth_signup()
        tester.test_auth_login()
        tester.test_auth_me()
        tester.test_users_endpoints()
        tester.test_tasks_endpoints()
        tester.test_comments_endpoints()
        tester.test_meetings_endpoints()
        tester.test_approvals_endpoints()
        tester.test_notifications_endpoints()
        tester.test_stats_endpoint()
        tester.test_delete_operations()
        
    except Exception as e:
        print(f"\n❌ Testing stopped due to error: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend API is working correctly.")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed_tests} tests failed. Check the output above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())