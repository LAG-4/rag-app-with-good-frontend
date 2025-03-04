import { NextResponse } from 'next/server';
import { ChatGroq } from '@langchain/groq';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from '@langchain/core/documents';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as fs from 'fs/promises';
import * as path from 'path';

// Initialize Groq Chat Model
const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  maxTokens: 2048, // Reduced max tokens
});

// Create a text splitter with smaller chunks
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 2000, // Reduced chunk size
  chunkOverlap: 100, // Reduced overlap
});

// Create a prompt template for summarization
const summarizePrompt = PromptTemplate.fromTemplate(`
Summarize the following text section concisely:

Text (part {partNumber} of {totalParts}):
{text}

Key points only, be brief.
`);

// Create a prompt template for final summary
const finalSummaryPrompt = PromptTemplate.fromTemplate(`
Combine these section summaries into one coherent summary:

{summaries}

Provide a clear, concise final summary.
`);

// Create the summarization chains
const summarizeChain = summarizePrompt
  .pipe(model)
  .pipe(new StringOutputParser());

const finalSummaryChain = finalSummaryPrompt
  .pipe(model)
  .pipe(new StringOutputParser());

interface GroqError extends Error {
  status?: number;
}

// Add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function processSectionWithRetry(text: string, partNumber: number, totalParts: number, retries = 3): Promise<string> {
  try {
    // Add delay between API calls to respect rate limits
    await delay(1000); // 1 second delay between calls
    
    return await summarizeChain.invoke({
      text,
      partNumber: partNumber + 1,
      totalParts
    });
  } catch (error) {
    const groqError = error as GroqError;
    if (retries > 0 && groqError.status === 413) {
      // If the chunk is still too large, split it further
      const smallerChunks = await textSplitter.splitText(text);
      const summaries = await Promise.all(
        smallerChunks.map(chunk => processSectionWithRetry(chunk, partNumber, totalParts, retries - 1))
      );
      return summaries.join('\n\n');
    }
    throw error;
  }
}

async function processChunksInBatches(chunks: string[], batchSize: number = 3): Promise<string[]> {
  const results: string[] = [];
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((chunk, index) => 
        processSectionWithRetry(chunk, i + index, chunks.length)
      )
    );
    results.push(...batchResults);
    
    // Add delay between batches
    if (i + batchSize < chunks.length) {
      await delay(2000); // 2 seconds delay between batches
    }
  }
  
  return results;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert the file to a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process different file types
    let text = '';
    if (file.type === 'application/pdf') {
      // Create a temporary file
      const tempDir = path.join(process.cwd(), 'tmp');
      await fs.mkdir(tempDir, { recursive: true });
      const tempFilePath = path.join(tempDir, 'temp.pdf');
      await fs.writeFile(tempFilePath, buffer);

      // Load and process the PDF
      const loader = new PDFLoader(tempFilePath);
      const docs = await loader.load();
      text = docs.map((doc: Document) => doc.pageContent).join('\n');

      // Clean up
      await fs.unlink(tempFilePath);
    } else {
      // Handle text files
      text = buffer.toString('utf-8');
    }

    // Split the text into chunks
    const chunks = await textSplitter.splitText(text);

    // Process chunks in batches
    const sectionSummaries = await processChunksInBatches(chunks);

    // If we have multiple chunks, combine their summaries
    let finalSummary;
    if (chunks.length > 1) {
      // Add delay before final summary to respect rate limits
      await delay(1000);
      finalSummary = await finalSummaryChain.invoke({
        summaries: sectionSummaries.join('\n\n')
      });
    } else {
      finalSummary = sectionSummaries[0];
    }

    return NextResponse.json({ summary: finalSummary });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Error processing file' },
      { status: 500 }
    );
  }
} 