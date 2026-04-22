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
 * Fallback AI Models
 * Primary model first, then fallback options in order
 */
const AI_MODELS = [
  'gemini-pro',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

/**
 * Generate content using fallback models
 * Attempts primary model, falls back to alternatives on failure
 * @param {Object} genAI - GoogleGenerativeAI instance
 * @param {string} prompt - The prompt to send
 * @returns {Promise<string>} - Generated text response
 */
const generateWithFallback = async (genAI, prompt) => {
  let lastError;
  
  for (let i = 0; i < AI_MODELS.length; i++) {
    const modelName = AI_MODELS[i];
    try {
      console.log(`[CHATBOT] Attempting model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const textResponse = result.response.text();
      console.log(`[CHATBOT] Successfully used model: ${modelName}`);
      return textResponse;
    } catch (error) {
      lastError = error;
      console.warn(`[CHATBOT] Model ${modelName} failed:`, error.message);
      
      // If not the last model, try the next one
      if (i < AI_MODELS.length - 1) {
        console.log(`[CHATBOT] Trying fallback model...`);
      }
    }
  }
  
  // All models failed
  throw new Error(`All fallback models failed. Last error: ${lastError.message}`);
};

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
    // 1. Fetch lightweight context from DB (Firebase is primary; MongoDB may be unavailable)
    let activeProjects = 'Project data is managed via Firebase Firestore.';
    try {
      const projects = await Project.find({ isPublic: true }).select('title description category status -_id').limit(5).lean();
      if (projects && projects.length > 0) {
        activeProjects = projects.map(p => `- ${p.title} (${p.category}): ${p.description.substring(0,60)}... Status: ${p.status}`).join('\n');
      }
    } catch (dbErr) {
      console.warn('[CHATBOT] MongoDB unavailable, continuing without project context:', dbErr.message);
    }

    // 2. Setup Gemini AI instance
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // 3. Build the prompt
    const prompt = `
    You are CollabAI, the helpful assistant for CollabSphere, a platform for college students to build projects with strangers and discover college events.
    Your tone should be helpful, concise, and futuristic. Use standard HTML tags (like <b>, <br>) or simple Markdown where appropriate to format your response, but do not use an overall html wrapper. 
    You are currently chatting with a user. They can navigate the site easily through HTML links. 
    If they ask about projects, tell them to visit <a href="projects.html" style="color:var(--primary);text-decoration:underline;">Explore Projects</a>.
    If they want to browse events, direct them to <a href="events.html" style="color:#34D399;text-decoration:underline;">Events</a>.
    If they want to create a project or event, direct them to dashboard.
    
    Here is some real-time context about our active public projects:
    ${activeProjects}
    
    User Query: "${message}"
    
    Respond directly to the user in a helpful manner.
    `;

    // 4. Generate response with fallback models
    const textResponse = await generateWithFallback(genAI, prompt);

    res.status(200).json({
      success: true,
      reply: textResponse,
    });

  } catch (error) {
    console.error('Gemini Generation Error:', error);
    
    // Provide a helpful fallback response if AI fails
    const fallbackResponse = `
    I'm currently having a bit of trouble connecting to my AI brain, but I'm still here to help! <br><br>
    You can check out our current projects here: <a href="projects.html" style="color:var(--primary);text-decoration:underline;">Explore Projects</a><br>
    Or see upcoming college events: <a href="events.html" style="color:#34D399;text-decoration:underline;">Events</a><br><br>
    If you're having technical issues, make sure your GEMINI_API_KEY is active!
    `;

    res.status(200).json({
      success: true,
      reply: fallbackResponse,
      isFallback: true
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
