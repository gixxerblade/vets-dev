# Writing Effective Tools for Agents — With Agents

## Overview

Anthropic's engineering team shares techniques for building high-quality tools that LLM agents can effectively use. The approach emphasizes evaluation-driven development and collaboration between humans and AI systems.

## Key Sections

### What is a Tool?

Tools represent a new contract between deterministic systems and non-deterministic agents. Unlike traditional software functions that produce identical outputs given identical inputs, agents may call tools in varied ways or choose alternative approaches entirely. This requires fundamentally rethinking software design principles.

### How to Write Tools

The recommended workflow involves three phases:

**Building a Prototype**
Start with quick implementations using Claude Code. Provide LLM-friendly documentation (such as `llms.txt` files) for relevant libraries and APIs. Wrap tools in local MCP servers or Desktop extensions for testing within Claude Code or the Claude Desktop application.

**Running an Evaluation**
Generate evaluation tasks grounded in realistic workflows. Examples include multi-step operations like "Schedule a meeting with Jane next week to discuss our latest Acme Corp project. Attach notes from our last project planning meeting and reserve a conference room."

Measure performance programmatically using simple agentic loops with alternating LLM API and tool calls. Collect metrics beyond accuracy: runtime, token consumption, tool call frequency, and error rates.

**Collaborating with Agents**
Paste evaluation transcripts into Claude Code and let the AI system analyze results and suggest tool improvements. This iterative process has proven effective for optimizing both implementation and descriptions.

### Principles for Effective Tools

**Choosing the Right Tools**
More tools don't necessarily improve outcomes. Implement thoughtful tools targeting specific high-impact workflows rather than wrapping every API endpoint. Tools can consolidate multiple operations—for example, a `schedule_event` tool that handles availability checking rather than separate `list_users`, `list_events`, and `create_event` tools.

**Namespacing**
Group related tools under common prefixes (e.g., `asana_search`, `asana_projects_search`) to help agents distinguish between overlapping functionalities and reduce confusion.

**Meaningful Context**
Return only high-signal information to agents. Use semantic identifiers like "name" and "image_url" rather than technical identifiers like UUIDs and MIME types. Implement response format parameters allowing agents to request "concise" or "detailed" outputs based on task requirements.

**Token Efficiency**
Implement pagination, filtering, and truncation with sensible defaults. Provide helpful guidance when truncating responses—for instance, suggesting more targeted searches over broad ones. Claude Code restricts tool responses to 25,000 tokens by default.

**Tool Descriptions**
Prompt-engineer descriptions as if explaining to a new team member. Make implicit context explicit. Use unambiguous parameter names (`user_id` rather than `user`). Small refinements to descriptions yield measurable performance improvements.

## Results

Internal testing demonstrated substantial improvements. A Slack MCP server optimized through this process outperformed human-written baselines. Similarly, an Asana MCP server showed marked accuracy gains on held-out test sets.

## Conclusion

Effective agent tools require rethinking traditional software design. By systematically evaluating performance, collaborating with AI systems on iterative improvements, and following established principles about context usage and clarity, developers can create tools that agents intuitively and effectively employ for real-world tasks.