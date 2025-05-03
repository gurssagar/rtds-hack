import { experimental_createMCPClient, streamText } from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import { groq } from '@ai-sdk/groq';
import {google } from '@ai-sdk/google';

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();
  let collectedContent = '';
  let stdioClient: any;
  let clientOne: any;
  let clientTwo: any;
  let clientThree: any;
  try {
    
    const transport = new Experimental_StdioMCPTransport({
        command: 'bun',
        args: ['C:/Users/Gursa/OneDrive/Desktop/web/gitfund/gitfund-backend/rtds-hack/mcp/index.ts'],
      });
      clientOne = await experimental_createMCPClient({
        transport,
      });

    
      const toolSetOne = await clientOne.tools();
      const tools = {
        ...toolSetOne,// note: this approach causes subsequent tool sets to override tools with the same name
      };
    const response = await streamText({
      model: google('gemini-2.0-flash'),
      prompt:"Suggest me a gpu with price per hour near to 1 usd",
    });
  
    return response.toDataStreamResponse();

  } catch (error) {
    console.error('Error:', error);
    if (stdioClient) {
      await stdioClient.close().catch((e: Error) => console.error('Error closing client:', e));
    }
    return new Response('Internal Server Error', { status: 500 });
  }
}