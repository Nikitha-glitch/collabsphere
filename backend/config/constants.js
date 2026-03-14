/**
 * Application Constants
 * Central location for all application-wide constants
 */

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// User Roles
const USER_ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
};

// Project Status
const PROJECT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ON_HOLD: 'on-hold',
};

// Project Categories
const PROJECT_CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'AI',
  'DevOps',
  'Cloud',
  'IoT',
  'Blockchain',
  'Other',
];

// Event Types
const EVENT_TYPES = {
  WEBINAR: 'webinar',
  WORKSHOP: 'workshop',
  HACKATHON: 'hackathon',
  CONFERENCE: 'conference',
  MEETUP: 'meetup',
  OTHER: 'other',
};

// Event Status
const EVENT_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Event Categories
const EVENT_CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'AI',
  'DevOps',
  'Cloud',
  'IoT',
  'Blockchain',
  'Career',
  'Other',
];

// Join Request Status
const JOIN_REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

// Event Registration Status
const REGISTRATION_STATUS = {
  REGISTERED: 'registered',
  ATTENDED: 'attended',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
};

// Chat Message Types
const CHAT_MESSAGE_TYPES = {
  QUESTION: 'question',
  GREETING: 'greeting',
  NAVIGATION: 'navigation',
  OTHER: 'other',
};

// Validation Constraints
const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 100,
  MAX_NAME_LENGTH: 50,
  MAX_EMAIL_LENGTH: 100,
  MAX_BIO_LENGTH: 500,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_FEEDBACK_LENGTH: 500,
  MIN_TEAM_SIZE: 1,
  MAX_TEAM_SIZE: 100,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
};

// File Upload
const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'gif'],
  UPLOAD_DIR: '/uploads',
};

// Error Messages
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  USER_NOT_FOUND: 'User not found',
  PROJECT_NOT_FOUND: 'Project not found',
  EVENT_NOT_FOUND: 'Event not found',
  UNAUTHORIZED: 'Not authorized to perform this action',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid token',
};

// Success Messages
const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'Registration successful',
  LOGIN_SUCCESS: 'Login successful',
  PROJECT_CREATED: 'Project created successfully',
  PROJECT_UPDATED: 'Project updated successfully',
  PROJECT_DELETED: 'Project deleted successfully',
  EVENT_CREATED: 'Event created successfully',
  EVENT_UPDATED: 'Event updated successfully',
  EVENT_DELETED: 'Event deleted successfully',
  REGISTERED_FOR_EVENT: 'Successfully registered for event',
  REGISTRATION_CANCELLED: 'Registration cancelled successfully',
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Sorting
const SORT_ORDER = {
  ASC: 1,
  DESC: -1,
};

// Date/Time
const DATE_FORMAT = 'YYYY-MM-DD';
const TIME_FORMAT = 'HH:mm:ss';

// JWT
const JWT_DEFAULTS = {
  ALGORITHM: 'HS256',
  DEFAULT_EXPIRY: '7d',
};

module.exports = {
  HTTP_STATUS,
  USER_ROLES,
  PROJECT_STATUS,
  PROJECT_CATEGORIES,
  EVENT_TYPES,
  EVENT_STATUS,
  EVENT_CATEGORIES,
  JOIN_REQUEST_STATUS,
  REGISTRATION_STATUS,
  CHAT_MESSAGE_TYPES,
  VALIDATION,
  FILE_UPLOAD,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PAGINATION,
  SORT_ORDER,
  DATE_FORMAT,
  TIME_FORMAT,
  JWT_DEFAULTS,
};
