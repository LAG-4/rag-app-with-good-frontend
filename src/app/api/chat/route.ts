import { NextResponse } from 'next/server';
import { ChatGroq } from '@langchain/groq';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';

// Initialize Groq Chat Model
const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama2-70b-4096",  // Using Llama 3 70B model
  temperature: 0.7,
  maxTokens: 4096,
});

// Create a prompt template for chat
const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant that answers questions about documents. Provide clear, detailed, and accurate answers based on the context provided. If you're unsure about something, please say so."],
  ["human", "{message}"]
]);

// Create the chat chain
const chatChain = chatPrompt
  .pipe(model)
  .pipe(new StringOutputParser());

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'No message provided' },
        { status: 400 }
      );
    }

    // Process the message using LangChain and Groq
    const response = await chatChain.invoke({
      message: message,
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: 'Error processing chat request' },
      { status: 500 }
    );
  }
} 