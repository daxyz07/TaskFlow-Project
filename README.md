# Here are your Instructions
erDiagram
  USER {
    string id PK
    string email "unique"
    string password_hash
    string name
    string role
    string avatar
    datetime created_at
  }

  TASK {
    string id PK
    string title
    string description
    string status
    string priority
    string reporter_id FK
    string assignee_id FK "nullable"
    datetime due_date "nullable"
    datetime created_at
    datetime updated_at
  }

  COMMENT {
    string id PK
    string task_id FK
    string user_id FK
    string content
    datetime created_at
  }

  APPROVAL {
    string id PK
    string task_id FK
    string requester_id FK
    string approver_id FK
    string status
    string description "nullable"
    datetime created_at
    datetime updated_at
  }

  NOTIFICATION {
    string id PK
    string user_id FK
    string message
    string type
    boolean read
    datetime created_at
  }

  MEETING {
    string id PK
    string title
    string description "nullable"
    datetime datetime
    string status
    datetime created_at
  }

  MEETING_ATTENDEE {
    string id PK
    string meeting_id FK
    string user_id FK
  }

  TASK_TAG {
    string id PK
    string task_id FK
    string tag
  }

  TASK_ATTACHMENT {
    string id PK
    string task_id FK
    string filename
  }

  COMMENT_ATTACHMENT {
    string id PK
    string comment_id FK
    string filename
  }

  USER ||--o{ TASK : reports
  USER o|--o{ TASK : assigned_to
  TASK ||--o{ COMMENT : has
  USER ||--o{ COMMENT : writes

  TASK ||--o{ APPROVAL : needs
  USER ||--o{ APPROVAL : requests
  USER ||--o{ APPROVAL : approves

  USER ||--o{ NOTIFICATION : receives

  MEETING ||--o{ MEETING_ATTENDEE : includes
  USER ||--o{ MEETING_ATTENDEE : attends

  TASK ||--o{ TASK_TAG : has
  TASK ||--o{ TASK_ATTACHMENT : has
  COMMENT ||--o{ COMMENT_ATTACHMENT : has


  flowchart LR
  U[User]
  D2[(Tasks)]
  D5[(Approvals)]

  P91((9.1 Compute Task Counts))
  P92((9.2 Compute Approval Counts))
  P93((9.3 Build Dashboard Response))

  U -->|Stats Request| P93

  P93 --> P91
  P91 -->|Count Tasks by Status| D2
  D2 -->|Task Totals| P91
  P91 --> P93

  P93 --> P92
  P92 -->|Count Pending Approvals| D5
  D5 -->|Approval Totals| P92
  P92 --> P93

  P93 -->|Dashboard Stats| U

6.3 Data Dictionary

1. Table: user_detail

Attribute       Data Type           Description
id             varchar(36) (PK)    Unique identifier for each user
name           varchar(100)        User’s full name
email          varchar(100)        User’s email (used for login, unique)
password_hash  varchar(255)        Hashed login password
role           varchar(20)         Role of user (admin, manager, member)
avatar         varchar(255)        File name/URL of user’s profile image (nullable)
created_at     datetime            Date and time when the user account was created

2. Table: task_detail

Attribute       Data Type           Description
id             varchar(36) (PK)    Unique identifier for each task
title          varchar(150)        Short title of the task
description    text                Detailed description of the task (nullable)
status         varchar(20)         Task status (todo, in_progress, review, done, etc.)
priority       varchar(20)         Task priority (low, medium, high)
reporter_id    varchar(36) (FK)    User who created/reported the task (user_detail.id)
assignee_id    varchar(36) (FK)    User assigned to the task (user_detail.id, nullable)
due_date       datetime            Due date for task completion (nullable)
tags           varchar(255)        Comma-separated list of tags (nullable)
images         varchar(500)        Comma-separated list of image/file names (nullable)
created_at     datetime            Date and time when the task was created
updated_at     datetime            Date and time when the task was last updated

3. Table: comment_detail

Attribute    Data Type           Description
id          varchar(36) (PK)    Unique identifier for each comment
task_id     varchar(36) (FK)    Task on which comment is posted (task_detail.id)
user_id     varchar(36) (FK)    User who wrote the comment (user_detail.id)
content     text                Comment text/content
images      varchar(500)        Comma-separated list of attached image file names
created_at  datetime            Date and time when the comment was created

4. Table: meeting_detail

Attribute    Data Type           Description
id          varchar(36) (PK)    Unique identifier for each meeting
title       varchar(150)        Meeting title
description text                Meeting description / agenda (nullable)
datetime    datetime            Scheduled date and time of the meeting
attendees   varchar(500)        Comma-separated list of attendee user IDs
status      varchar(20)         Meeting status (scheduled, completed, canceled)
created_at  datetime            Date and time when the meeting was created

5. Table: approval_detail

Attribute     Data Type           Description
id           varchar(36) (PK)    Unique identifier for each approval request
task_id      varchar(36) (FK)    Related task needing approval (task_detail.id)
requester_id varchar(36) (FK)    User who raised the approval request (user_detail.id)
approver_id  varchar(36) (FK)    User who must approve/reject (user_detail.id)
status       varchar(20)         Approval status (pending, approved, rejected)
description  text                Additional notes/description by requester (nullable)
created_at   datetime            Date and time when the approval was created
updated_at   datetime            Date and time when the approval status was last updated

6. Table: notification_detail

Attribute    Data Type           Description
id          varchar(36) (PK)    Unique identifier for each notification
user_id     varchar(36) (FK)    User who will receive the notification (user_detail.id)
message     varchar(255)        Notification message text
type        varchar(50)         Notification type (task_assigned, approval_request, approval_response)
read        bit / boolean       Read status (0 = unread, 1 = read)
created_at  datetime            Date and time when the notification was generated

7. Table: file_upload_detail

Attribute         Data Type           Description
id               varchar(36) (PK)    Unique identifier for each uploaded file
filename         varchar(255)        Actual stored file name on server
url              varchar(255)        Public/relative URL used to access the file
uploaded_by      varchar(36) (FK)    User who uploaded the file (user_detail.id)
uploaded_at      datetime            Date and time when the file was uploaded
linked_task_id   varchar(36) (FK)    Related task (task_detail.id, nullable)
linked_comment_id varchar(36) (FK)   Related comment (comment_detail.id, nullable)