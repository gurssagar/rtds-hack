#!/usr/bin/env node
import { Server } from '@highlight-ai/mcp-sdk/server/index.js'
import { StdioServerTransport } from '@highlight-ai/mcp-sdk/server/stdio.js'
import {
    ListToolsRequestSchema,
    GetAuthTokenRequestSchema,
    CallToolRequestSchema,
    ErrorCode,
    McpError,
} from '@highlight-ai/mcp-sdk/types.js'
import { z } from 'zod'



class PricingServer {
    private server: Server

    constructor() {
        this.server = new Server(
            {
                name: 'pricing-server',
                version: '0.0.1',
            },
            {
                capabilities: {
                    resources: {},
                    tools: {},
                },
            },
        )

        this.setupHandlers()
        this.setupErrorHandling()
    }

    private setupErrorHandling(): void {
        this.server.onerror = (error) => {
            console.error('[MCP Error]', error)
        }

        process.on('SIGINT', async () => {
            await this.server.close()
            process.exit(0)
        })
    }

    private setupHandlers(): void {
        this.setupToolHandlers()
    }

    private setupToolHandlers(): void {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'get_pricing_context',
                    description: 'Fetch pricing context from Ace Cloud Hosting API',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                        required: [],
                    },
                },
            ],
        }))

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            if (request.params.name !== 'get_pricing_context') {
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`)
            }

            // Fetch pricing data from the API
            const response = await fetch('https://customer.acecloudhosting.com/api/v1/pricing/region-us-east-at-1')
            if (!response.ok) {
                throw new Error('Failed to fetch pricing data')
            }
            const data = await response.text()

            return {
                content: [
                    {
                        type: 'text',
                        text: data,
                    },
                ],
            }
        })
    }

    async run(): Promise<void> {
        const transport = new StdioServerTransport()
        await this.server.connect(transport)
        console.log('Pricing MCP server running on stdio')
    }
}

const server = new PricingServer()
server.run().catch(console.error)