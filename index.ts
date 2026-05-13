/**
 * DeepWiki Tool Extension
 *
 * Registers deepwiki as a proper tool so it works in plan mode
 * (where bash is restricted to read-only commands).
 *
 * Queries GitHub repository documentation via DeepWiki's MCP API.
 */

import type { ExtensionAPI, Theme } from "@earendil-works/pi-coding-agent";
import { keyHint } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "@sinclair/typebox";

const MCP_ENDPOINT = "https://mcp.deepwiki.com/mcp";

async function callMCP(method: string, args: Record<string, unknown>, signal?: AbortSignal): Promise<any> {
	const payload = JSON.stringify({
		jsonrpc: "2.0",
		method: "tools/call",
		params: {
			name: method,
			arguments: args,
		},
		id: 1,
	});

	const response = await fetch(MCP_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json, text/event-stream",
		},
		body: payload,
		signal,
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`DeepWiki API returned ${response.status}: ${errorText}`);
	}

	const data: any = await response.json();
	if (data.error) {
		throw new Error(`DeepWiki API error: ${data.error.message}`);
	}

	return data.result;
}

export default function deepwikiExtension(pi: ExtensionAPI) {
	pi.registerTool({
		name: "deepwiki",
		label: "DeepWiki",
		description: 'Query any public GitHub repository\'s codebase and documentation via DeepWiki. Use it as both a reference and a consultant — ask how a project works internally, or how it would approach a problem. Examples: "How does X implement Y?", "What pattern would this project use for Z?". No API key required.',
		parameters: Type.Object({
			repo: Type.String({
				description: 'The GitHub repository to query (e.g., "owner/repo" or full URL)',
			}),
			query: Type.String({
				description: "The question or query about the repository",
			}),
			action: Type.Optional(
				Type.Union([Type.Literal("ask"), Type.Literal("structure"), Type.Literal("read")], {
					description: 'Action to perform: "ask" (default), "structure" (wiki TOC), or "read" (full wiki content).',
				})
			),
		}),
		renderCall(args, theme) {
			const action = args.action || "ask";
			let text = theme.fg("toolTitle", theme.bold("deepwiki "));
			text += theme.fg("muted", action);
			text += "\n" + theme.fg("dim", `${args.repo}: ${args.query}`);
			return new Text(text, 0, 0);
		},
		renderResult(result, { expanded }, theme) {
			const details = result.details as any;
			if (details?.error) {
				return new Text(theme.fg("error", `Error: ${details.message}`), 0, 0);
			}

			const content = result.content[0];
			const answer = content?.type === "text" ? content.text : "";
			const lines = answer.split("\n");
			const previewLines = 5;

			let text = "";
			if (expanded) {
				text += answer;
			} else {
				text += lines.slice(0, previewLines).join("\n");
				if (lines.length > previewLines) {
					text += "\n" + theme.fg("dim", `... ${lines.length - previewLines} more lines (${keyHint("expandTools", "to expand")})`);
				}
			}
			return new Text(text, 0, 0);
		},
		async execute(toolCallId, params, signal, onUpdate) {
			const { repo, query, action = "ask" } = params;

			onUpdate?.({
				content: [{ type: "text", text: `Querying DeepWiki...` }],
				details: { repo, query, action },
			});

			try {
				let method = "ask_question";
				let args: any = { repoName: repo, question: query };

				if (action === "structure") {
					method = "read_wiki_structure";
					args = { repoName: repo };
				} else if (action === "read") {
					method = "read_wiki_contents";
					args = { repoName: repo };
				}

				const result = await callMCP(method, args, signal);
				
				const text = result.content?.[0]?.text || "No response received.";

				return {
					content: [{ type: "text", text }],
					details: {
						repo,
						query,
						action,
						...result,
					},
				};
			} catch (error: any) {
				return {
					content: [{ type: "text", text: `DeepWiki error: ${error.message}` }],
					details: { repo, query, action, error: true, message: error.message },
					isError: true,
				};
			}
		},
	});
}
