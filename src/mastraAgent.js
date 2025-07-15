require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = "gpt-4o";

const promptLibrary = {
    'tic-tac-toe': {
        keywords: ['tic tac toe', 'tic-tac-toe', 'noughts and crosses'],
        prompt: `
        Generate a complete, self-contained HTML file for a Tic-Tac-Toe game.
        It must include:
        - HTML structure: A 3x3 grid for the game board and a status display to show whose turn it is and the game result (win, draw).
        - CSS: Clean styling for the grid, cells, and status message. Cells should be clearly defined squares. 'X' and 'O' should be large and centered.
        - JavaScript:
            - Logic to handle player turns (X and O).
            - Click event listeners on the grid cells. A cell can only be marked once.
            - Logic to check for a win condition (rows, columns, diagonals) or a draw after every move.
            - A "Restart Game" button to clear the board and start a new game.
            - All JavaScript logic must be inside a single <script> tag.
        - Remember: The output must ONLY be the raw HTML content.
        `
    },
    'portfolio': {
        keywords: ['stock portfolio', 'investment tracker', 'stock app'],
        prompt: `
        Generate a complete, self-contained HTML file for a simple stock portfolio tracking application.
        It must include:
        - HTML structure: An input form to add new stocks (ticker symbol, quantity, purchase price). A table to display the portfolio (Ticker, Quantity, Purchase Price, Current Price, Total Value, Gain/Loss). A summary section for total portfolio value.
        - CSS: A clean and readable layout for the form and table. Use alternating row colors for the table. Indicate gains in green and losses in red.
        - JavaScript:
            - An array to hold the portfolio data (use mock data for initial state).
            - Functionality to add a new stock from the form to the portfolio array and re-render the table.
            - A "Refresh Prices" button. When clicked, it should simulate fetching new prices by generating a random new price for each stock within +/- 10% of its purchase price.
            - Logic to calculate the current value, total value, and gain/loss for each stock and for the total portfolio.
            - All JavaScript logic must be inside a single <script> tag. Do not use any external APIs.
        - Remember: The output must ONLY be the raw HTML content.
        `
    },
    'drawing': {
        keywords: ['drawing tool', 'excalidraw', 'paint app', 'canvas tool'],
        prompt: `
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
        - Remember: The output must ONLY be the raw HTML content.
        `
    }
};

function getBestPrompt(userPrompt) {
    const lowerCasePrompt = userPrompt.toLowerCase();
    for (const key in promptLibrary) {
        const app = promptLibrary[key];
        for (const keyword of app.keywords) {
            if (lowerCasePrompt.includes(keyword)) {
                console.log(`Matched user prompt to "${key}" application.`);
                return app.prompt;
            }
        }
    }
    console.log("No specific application matched. Using generic prompt.");
    return null;
}


async function generateAppCode(userPrompt) {
  const systemPrompt = `
    You are an expert web developer specializing in creating single-file HTML applications.
    Your task is to generate complete, self-contained HTML files including all CSS
    within <style> tags and all JavaScript within <script> tags.
    Do not use any external files, libraries, or APIs unless specifically asked to simulate them in the prompt.
    The output must ONLY be the raw HTML content, nothing else. Do not wrap the code in markdown backticks or add any explanations.
  `;

  let finalUserPrompt = getBestPrompt(userPrompt);

  if (!finalUserPrompt) {
      finalUserPrompt = `
        Generate a complete, self-contained HTML file for the following user request: "${userPrompt}".
        Ensure that all CSS is included in <style> tags and all JavaScript is in <script> tags.
        Do not use any external files or libraries.
        The final output should be only the raw HTML code.
      `;
  }

  try {
    console.log(`Sending prompt to OpenAI model: ${MODEL}`);
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: finalUserPrompt },
      ],
      temperature: 0.7,
    });

    const generatedText = response.choices[0].message.content;

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
    throw error;
  }
}

module.exports = { generateAppCode };

