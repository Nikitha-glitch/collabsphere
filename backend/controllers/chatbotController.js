/**
 * Chatbot Controller
 * Handles chatbot interactions and responses
 */

const { asyncHandler } = require('../middleware/errorMiddleware');
const ChatLog = require('../models/ChatLog');

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Project = require('../models/Project');
const Event = require('../models/Event');

/**
 * Send message to chatbot
 * @route   POST /api/chatbot/message
 * @desc    Send a message to the chatbot and get response
 * @access  Public
 */
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: 'Message text is required' });
  }

  // Fallback if API key is not present
  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json({
      success: true,
      message: 'CollabSphere AI is currently undergoing maintenance. Please provide a GEMINI_API_KEY in the backend .env configuration to activate.',
    });
  }

  try {
    // 1. Fetch lightweight context from DB
    const projects = await Project.find({ isPublic: true }).select('title description category status -_id').limit(5).lean();
    const activeProjects = projects.map(p => `- ${p.title} (${p.category}): ${p.description.substring(0,60)}... Status: ${p.status}`).join('\n');
    
    // 2. Setup Gemini AI instance
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 3. Build the prompt
    const prompt = `
    You are CollabAI, the helpful assistant for CollabSphere, a platform for college students to build projects with strangers and discover college events.
    Your tone should be helpful, concise, and futuristic. Use standard HTML tags (like <b>, <br>) or simple Markdown where appropriate to format your response, but do not use an overall html wrapper. 
    You are currently chatting with a user. They can navigate the site easily through HTML links. 
    If they ask about projects, tell them to visit <a href="projects.html" style="color:var(--primary);text-decoration:underline;">Explore Projects</a>.
    If they want to browse events, direct them to <a href="events.html" style="color:#34D399;text-decoration:underline;">Events</a>.
    If they want to create a project or event, direct them to dashboard.
    
    Here is some real-time context about our active public projects from the database:
    ${activeProjects || "No public projects currently available."}
    
    User Query: "${message}"
    
    Respond directly to the user in a helpful manner.
    `;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();

    res.status(200).json({
      success: true,
      reply: textResponse,
    });

  } catch (error) {
    console.error('Gemini Generation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to communicate with AI',
      reply: 'Sorry, I ran into a cognitive error. Please try again later.'
    });
  }
});

/**
 * Get chat history
 * @route   GET /api/chatbot/history/:sessionId
 * @desc    Retrieve chat history for a session
 * @access  Public
 */
exports.getChatHistory = asyncHandler(async (req, res, next) => {
  // TODO: Implement get chat history logic
  // 1. Get session ID from params
  // 2. Find all chat logs for session
  // 3. Sort by date ascending
  // 4. Return chat history

  res.status(200).json({
    success: true,
    message: 'Get chat history endpoint - Implementation pending',
  });
});

/**
 * Delete chat history
 * @route   DELETE /api/chatbot/history/:sessionId
 * @desc    Delete chat history for a session
 * @access  Public
 */
exports.deleteChatHistory = asyncHandler(async (req, res, next) => {
  // TODO: Implement delete chat history logic
  // 1. Get session ID from params
  // 2. Delete all chat logs for session
  // 3. Return success message

  res.status(200).json({
    success: true,
    message: 'Delete chat history endpoint - Implementation pending',
  });
});

/**
 * Submit chat feedback
 * @route   POST /api/chatbot/feedback
 * @desc    Submit feedback on chatbot response
 * @access  Public
 */
exports.submitChatFeedback = asyncHandler(async (req, res, next) => {
  // TODO: Implement submit feedback logic
  // 1. Get chat log ID and feedback from request
  // 2. Find chat log
  // 3. Update with feedback rating and comment
  // 4. Return updated chat log

  res.status(200).json({
    success: true,
    message: 'Submit chat feedback endpoint - Implementation pending',
  });
});
