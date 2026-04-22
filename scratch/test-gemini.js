const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './backend/.env' });

async function testGemini() {
    if (!process.env.GEMINI_API_KEY) {
        console.error('No GEMINI_API_KEY found in .env');
        return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    console.log('--- Testing Gemini Connectivity ---');
    try {
        // Try to list models to see what's actually available
        console.log('Attempting to list models...');
        // Note: listModels might not be available on all GenAI versions/keys easily, 
        // but we can try a simple generation with the most basic name.
        
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say 'System Online'");
        console.log('Response:', result.response.text());
        console.log('✅ Connectivity successful!');
    } catch (error) {
        console.error('❌ Connectivity failed.');
        console.error('Error Details:', error.message);
        if (error.message.includes('404')) {
            console.error('Hint: The model name was not found. Your API key might not have access to this model or version.');
        } else if (error.message.includes('403')) {
            console.error('Hint: Permission denied. Check if your API key is valid and has "Generative Language API" enabled in Google Cloud Console.');
        }
    }
}

testGemini();
