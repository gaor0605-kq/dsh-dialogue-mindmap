# dsh-dialogue-mindmap

English | [中文](README.zh.md)

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) Web UI plugin that adds a **Canvas** view beside the **Chat** tab of a conversation. Every turn of the session is drawn as a node in a mind map, and you can branch a follow-up from any node — inside the same session, without creating a new one.

## Features

- **Canvas tab** next to the Chat tab; click to switch between the two views of the same conversation. While the Canvas is shown, the composer below is hidden and the canvas fills the remaining height.
- **One node per turn**, laid out as a left-to-right tree. The first turn is the root; by default each new turn hangs under the previous one.
- **Branch from any node**: select a node, type a follow-up in the side panel and press the button (or Ctrl+Enter). The message is sent to the same session, prefixed with a short reference to the selected turn, and the resulting turn is attached as a child of that node. A dashed "waiting for answer" placeholder shows until the turn arrives.
- **Detail panel**: clicking a node opens a side panel with the full question and the full answer (scrollable), a button to switch back to the Chat view, and the branch input. Drag the panel's left edge to resize it (double-click the edge to reset); the width is remembered.
- **Pan and zoom**: drag empty canvas space to pan; mouse wheel zooms around the cursor (25%–250%); the bottom-right controls zoom out / reset / zoom in.

## Install

```sh
dsh plugin add dsh-dialogue-mindmap
```

Then refresh the Web UI and open any conversation — a **Canvas** tab appears next to **Chat**.

## Limitations

- The tree structure (which turn is a child of which node) is stored in the browser's `localStorage`, per session. It is not synced across browsers or devices; clearing site data resets the layout to a linear chain.
- Because branching happens inside one session, the model still sees the whole conversation history; the prefix only tells it which earlier turn the follow-up builds on.
- Full question/answer text in the detail panel is read from turns already loaded in the Chat view. For very old turns that are not loaded yet, the panel falls back to the truncated preview — scroll up in the Chat view once to load them.
- Hiding the composer relies on the Web UI's `data-composer-seat` attribute and may need an update if the host UI changes.

## Requirements

DeepSeek Harness Web UI (tested on dsh 0.2.1-rc.5). No host-side dependencies; the plugin is client-only.

## License

[MIT](LICENSE)
