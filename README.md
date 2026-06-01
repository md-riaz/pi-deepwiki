# pi-deepwiki

DeepWiki tool extension for the [Pi Coding Agent](https://github.com/earendil-works/pi).

It adds a `deepwiki` tool that lets Pi query public GitHub repositories through DeepWiki's MCP API. Use it to ask architecture questions, inspect codebase structure, or read generated wiki content without leaving Pi.

## Features

- Query any public GitHub repository by `owner/repo` or GitHub URL.
- Ask natural-language questions about code and documentation.
- Read DeepWiki wiki structure or full wiki contents.
- Works in normal and plan-mode contexts where shell access may be restricted.
- No API key required.
- Supports DeepWiki's `text/event-stream` MCP responses.

## Tool actions

| Action | Purpose | DeepWiki MCP method |
| --- | --- | --- |
| `ask` | Ask a question about a repository. Default action. | `ask_question` |
| `structure` | Read wiki table of contents / structure. | `read_wiki_structure` |
| `read` | Read full wiki contents. | `read_wiki_contents` |

## Example prompts

```text
Use deepwiki to ask earendil-works/pi how the TUI renders tool calls.
```

```text
Use deepwiki with action=structure for vercel/next.js.
```

```text
Use deepwiki to ask facebook/react: "How does the reconciler schedule updates?"
```

## Tool parameters

```ts
{
  repo: string;                  // e.g. "earendil-works/pi" or GitHub URL
  query: string;                 // question or query text
  action?: "ask" | "structure" | "read";
}
```

## Installation

Install directly from GitHub with Pi:

```bash
pi install github:md-riaz/pi-deepwiki
```

Then restart Pi so it reloads extensions.

### Update

```bash
pi install github:md-riaz/pi-deepwiki
```

Restart Pi after updating.

### Manual single-file install

If you do not want to use `pi install`, copy `index.ts` into Pi's extension directory:

```bash
mkdir -p ~/.pi/agent/extensions
curl -L https://raw.githubusercontent.com/md-riaz/pi-deepwiki/main/index.ts -o ~/.pi/agent/extensions/deepwiki.ts
```

Then restart Pi.

### Manual git checkout

```bash
git clone https://github.com/md-riaz/pi-deepwiki.git ~/.pi/agent/git/github.com/md-riaz/pi-deepwiki
mkdir -p ~/.pi/agent/extensions
cp ~/.pi/agent/git/github.com/md-riaz/pi-deepwiki/index.ts ~/.pi/agent/extensions/deepwiki.ts
```

Then restart Pi.

## Notes

- DeepWiki only works for repositories that DeepWiki can access and index.
- If DeepWiki returns “Repository not found”, visit the suggested `https://deepwiki.com/<owner>/<repo>` URL to index it.
- Network access is required because requests go to `https://mcp.deepwiki.com/mcp`.

## Development

This extension registers a Pi tool named `deepwiki` and maps actions to DeepWiki MCP `tools/call` requests.

Important implementation detail: DeepWiki may return responses as `text/event-stream`, so the extension parses SSE `data:` lines instead of assuming plain JSON.

## License

MIT
