-- SHABRI APPOINTMENT MANAGEMENT SYSTEM

CREATE TABLE appointments (
id INT PRIMARY KEY AUTO_INCREMENT,
token_number VARCHAR(20) NOT NULL,

```
citizen_name VARCHAR(100) NOT NULL,
mobile VARCHAR(15) NOT NULL,

purpose TEXT NOT NULL,

officer_name VARCHAR(100) DEFAULT 'Leena Bansod',

appointment_date DATE NOT NULL,
appointment_time TIME NOT NULL,

status VARCHAR(20) DEFAULT 'Waiting',

queue_position INT,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

);

CREATE TABLE holidays (
id INT PRIMARY KEY AUTO_INCREMENT,

```
holiday_name VARCHAR(100) NOT NULL,

holiday_date DATE NOT NULL,

holiday_type VARCHAR(20) DEFAULT 'Full Day',

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

);

CREATE TABLE events (
id INT PRIMARY KEY AUTO_INCREMENT,

```
title VARCHAR(200) NOT NULL,

description TEXT,

event_date DATE NOT NULL,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

);

CREATE TABLE staff (
id INT PRIMARY KEY AUTO_INCREMENT,

```
username VARCHAR(50) UNIQUE NOT NULL,

password VARCHAR(255) NOT NULL,

role VARCHAR(50) DEFAULT 'Admin',

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

);

CREATE TABLE notifications (
id INT PRIMARY KEY AUTO_INCREMENT,

```
appointment_id INT,

notification_type VARCHAR(50),

message TEXT,

sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

);
