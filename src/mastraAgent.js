// FILE: ./src/mastraAgent.js

require('dotenv').config();
const OpenAI = require('openai');

// 1. Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Uses the key from your .env file
});

const MODEL = "gpt-4o";

// 2. Define the code generation function using OpenAI
async function generateAppCode(userPrompt) {
  // System prompt to set the context for the AI
  const systemPrompt = `
    You are an expert web developer specializing in creating single-file HTML applications.
    Your task is to generate complete, self-contained HTML files including all CSS
    within <style> tags and all JavaScript within <script> tags.
    Do not use any external files or libraries.
    The output must ONLY be the raw HTML content, nothing else. Do not wrap the code in markdown backticks or add any explanations.
  `;

  // The detailed prompt for the specific app generation
  const fullUserPrompt = `
    Generate a complete, self-contained HTML file for a web application that functions like a simplified drawing tool, similar to Excalidraw.
    It must include:
    - HTML structure: A main drawing canvas (<canvas> element) and buttons for tools (e.g., "Select", "Line", "Rectangle", "Circle", "Clear").
    - CSS: Basic styling for the layout, buttons, and canvas. The canvas should fill the available space.
    - JavaScript:
      - Use the HTML5 Canvas API for all drawing operations.
      - Implement drawing modes for lines, rectangles, and circles by clicking and dragging.
      - Show a preview of the shape as the user drags.
      - A "Clear Canvas" button that erases everything.
      - Store drawn shapes in an array so the canvas can be redrawn.
      - Basic "Select Tool" functionality: clicking a drawn shape should highlight it.
      - All JavaScript logic must be inside a single <script> tag.
    - The user's specific request is: "${userPrompt}"
    - Remember: The output must ONLY be the raw HTML content.
  `;

  try {
    console.log(`Sending prompt to OpenAI model: ${MODEL}`);
    
    // 3. Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fullUserPrompt },
      ],
      temperature: 0.7, // A good balance between creativity and predictability for code
    });

    const generatedText = response.choices[0].message.content;

    // 4. Clean and return the response
    // The prompt already asks for raw HTML, but this is a good safeguard.
    const cleanedCode = generatedText.replace(/```html\n?|```/g, '').trim();
    return cleanedCode;

  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    if (error instanceof OpenAI.APIError) {
        console.error("OpenAI API Error details:", {
            status: error.status,
            message: error.message,
        });
    }
    throw error; // Re-throw the error to be caught by the main process
  }
}

module.exports = { generateAppCode };