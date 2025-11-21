export const GET = async (req) => {
    const name = "donnie-damato-mcp";
    const uri = new URL("/.well-known/mcp/resources.json", req.url.origin).toString();

    const response = {
        $schema: "https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json",
        version: "1.0",
        protocolVersion: "2025-06-18",
        serverInfo: {
            name,
            version: "1.0.0",
        },
        resources: [
            {
                name: `${name}-resources`,
                uri,
                mimeType: "application/json"
            }
        ]
    };

    return new Response(JSON.stringify(response, null, 2), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
        },
    });
}