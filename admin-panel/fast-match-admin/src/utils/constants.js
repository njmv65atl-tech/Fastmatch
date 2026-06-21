export const MOCK_USERS = [
  {
    id: '1',
    name: 'John Doe',
    email: 'johan@example.com',
    accountType: 'Premium',
    status: 'Active',
    lastActive: '2hr Ago',
    joinedDate: '2024-01-15',
    avatar: 'https://picsum.photos/seed/john/100/100'
  },
  {
    id: '2',
    name: 'Sarah max',
    email: 'sarah@example.com',
    accountType: 'Free',
    status: 'Active',
    lastActive: '1 day ago',
    joinedDate: '2023-11-20',
    avatar: 'https://picsum.photos/seed/sarah/100/100'
  },
  {
    id: '3',
    name: 'Emma Wilson',
    email: 'emma@example.com',
    accountType: 'Premium',
    status: 'Active',
    lastActive: '2hr Ago',
    joinedDate: '2024-02-10',
    avatar: 'https://picsum.photos/seed/emma/100/100'
  },
  {
    id: '4',
    name: 'Michael Brown',
    email: 'michael@example.com',
    accountType: 'Premium',
    status: 'Suspended',
    lastActive: '3 day ago',
    joinedDate: '2023-09-05',
    avatar: 'https://picsum.photos/seed/michael/100/100'
  }
];

export const MOCK_ACTIVITY = [
  {
    id: '1',
    user: 'Sarah Johnson',
    action: 'Successful login from unauthorized IP',
    timestamp: '2m ago',
    location: 'New York, USA',
    type: 'WARNING'
  },
  {
    id: '2',
    user: 'Michael Chen',
    action: 'Large data transfer: 4.2GB encrypted archive',
    timestamp: '15m ago',
    location: 'San Francisco, USA',
    type: 'SYSTEM INFO'
  },
  {
    id: '3',
    user: 'Emily Rodriguez',
    action: 'Root password changed from secondary device',
    timestamp: '1h ago',
    location: 'Miami, USA',
    type: 'CRITICAL'
  },
  {
    id: '4',
    user: 'David Thompson',
    action: "Shared directory 'Legacy Vault' with guest@extern.com",
    timestamp: '2h ago',
    location: 'Seattle, USA',
    type: 'POLICY'
  }
];

export const MOCK_SESSIONS = [
  {
    id: '1',
    user: 'Sarah Johnson',
    uid: '90214-SJ',
    device: 'iPhone 15 Pro',
    ip: '192.168.1.142',
    location: 'New York, USA',
    duration: '2m 15s',
    status: 'ACTIVE'
  },
  {
    id: '2',
    user: 'Michael Chen',
    uid: '88412-MC',
    device: 'MacBook Pro',
    ip: '172.24.0.19',
    location: 'San Francisco, USA',
    duration: '15m 42s',
    status: 'ACTIVE'
  },
  {
    id: '3',
    user: 'Emily Rodriguez',
    uid: '77123-ER',
    device: 'Galaxy S24',
    ip: 'Unknown',
    location: 'Unknown',
    duration: 'Idle for 12m',
    status: 'IDLE'
  }
];
