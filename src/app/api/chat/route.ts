import { NextResponse } from 'next/server';
import { ChatGroq } from '@langchain/groq';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';

// Initialize Groq Chat Model
const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  maxTokens: 2048,
});

// Create a prompt template for chat
const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant. Provide clear and concise answers."],
  ["human", "{message}"]
]);

// Create the chat chain
const chatChain = chatPrompt
  .pipe(model)
  .pipe(new StringOutputParser());

interface GroqError extends Error {
  status?: number;
}

// Add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function processMessageWithRetry(message: string, retries = 3): Promise<string> {
  try {
    // Add delay to respect rate limits
    await delay(1000);

    const response = await chatChain.invoke({
      message: message,
    });

    return response;
  } catch (error) {
    const groqError = error as GroqError;
    
    if (retries > 0) {
      if (groqError.status === 413) {
        // If message is too long, try with a shorter version
        const truncatedMessage = message.slice(0, 1500); // Truncate to 1500 characters
        console.log('Message too long, retrying with truncated version...');
        await delay(2000); // Wait before retry
        return processMessageWithRetry(truncatedMessage, retries - 1);
      } else {
        // For other errors, wait and retry
        console.log('Error occurred, retrying...');
        await delay(2000);
        return processMessageWithRetry(message, retries - 1);
      }
    }
    
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'No message provided' },
        { status: 400 }
      );
    }

    // Process the message with retry logic
    const response = await processMessageWithRetry(message);

    return NextResponse.json({ 
      response,
      status: 'success'
    });
  } catch (error) {
    console.error('Error in chat:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Error processing chat request';
    let statusCode = 500;

    const groqError = error as GroqError;
    if (groqError.status === 413) {
      errorMessage = 'Message too long. Please try a shorter message.';
      statusCode = 413;
    } else if (groqError.status === 429) {
      errorMessage = 'Too many requests. Please wait a moment and try again.';
      statusCode = 429;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        status: 'error'
      },
      { status: statusCode }
    );
  }
} 