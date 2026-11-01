window.__ModuleLoader__.load({
  id: 'dsh-dialogue-mindmap',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useMemo, useRef } = React;

    const NODE_W = 220, NODE_H = 76, GAP_X = 70, GAP_Y = 18, PAD = 32;
    const MARK = '【思维导图拓展】';

    const S = {
      root: { position: 'relative', display: 'flex', width: '100%', height: '100%', minHeight: 420, boxSizing: 'border-box', color: 'var(--dsw-alias-label-primary)' },
      board: { flex: 1, position: 'relative', overflow: 'hidden', cursor: 'grab', touchAction: 'none', userSelect: 'none', background: 'radial-gradient(circle, var(--dsw-alias-border-l1) 1px, transparent 1px) 0 0 / 22px 22px' },
      lines: { position: 'absolute', left: 0, top: 0, pointerEvents: 'none' },
      node: { position: 'absolute', width: NODE_W, height: NODE_H, boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 12, background: 'var(--dsw-alias-bg-layer-1)', boxShadow: '0 4px 14px rgba(0,0,0,.07)', cursor: 'pointer', overflow: 'hidden' },
      nodeRoot: { borderColor: 'var(--dsw-alias-brand-primary)' },
      nodeSel: { outline: '2px solid var(--dsw-alias-brand-primary)', outlineOffset: 1 },
      nodePending: { borderStyle: 'dashed', opacity: 0.75 },
      tag: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)', marginBottom: 3 },
      prompt: { fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
      resp: { fontSize: 12, marginTop: 3, color: 'var(--dsw-alias-label-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '16px' },
      side: { width: 380, flexShrink: 0, height: '100%', borderLeft: '1px solid var(--dsw-alias-border-l1)', background: 'var(--dsw-alias-bg-layer-1)', padding: 14, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' },
      h: { fontSize: 13, fontWeight: 650, flexShrink: 0 },
      text: { fontSize: 12, lineHeight: '18px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--dsw-alias-label-secondary)', maxHeight: 120, overflowY: 'auto', flexShrink: 0 },
      answer: { flex: '1 1 auto', minHeight: 160, overflowY: 'auto', fontSize: 13, lineHeight: '20px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--dsw-alias-label-primary)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--dsw-alias-border-l1)', background: 'var(--dsw-alias-bg-base)', overscrollBehavior: 'contain' },
      area: { width: '100%', minHeight: 72, flexShrink: 0, boxSizing: 'border-box', resize: 'vertical', padding: 8, borderRadius: 8, border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-base)', color: 'var(--dsw-alias-label-primary)', font: 'inherit', fontSize: 13 },
      btn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 32, border: '1px solid var(--dsw-alias-label-primary)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, lineHeight: '18px', fontWeight: 600, background: 'var(--dsw-alias-label-primary)', color: 'var(--dsw-alias-bg-base)', WebkitTextFillColor: 'var(--dsw-alias-bg-base)' },
      btnOff: { opacity: 0.45, cursor: 'not-allowed' },
      tools: { position: 'absolute', right: 12, bottom: 12, display: 'flex', gap: 6, zIndex: 2 },
      tool: { minWidth: 30, height: 30, borderRadius: 8, border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-1)', color: 'var(--dsw-alias-label-primary)', WebkitTextFillColor: 'var(--dsw-alias-label-primary)', cursor: 'pointer', fontSize: 13, padding: '0 8px' },
      btn2: { border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, background: 'transparent', color: 'var(--dsw-alias-label-primary)' },
      empty: { margin: 'auto', fontSize: 13, color: 'var(--dsw-alias-label-secondary)' },
    };

    const storeKey = (sid) => 'dialogue-mindmap:' + sid;
    const load = (sid) => { try { return JSON.parse(localStorage.getItem(storeKey(sid))) || {}; } catch { return {}; } };
    const save = (sid, v) => { try { localStorage.setItem(storeKey(sid), JSON.stringify(v)); } catch {} };
    const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; };
    const stripMark = (p) => { const s = String(p || ''); const i = s.indexOf(MARK); if (i < 0) return s; const j = s.indexOf('\n', i); return j < 0 ? s : s.slice(j + 1).trim(); };

    const NO_ITEMS = [];
    function useTurns(useChat) {
      if (typeof useChat !== 'function') return NO_ITEMS;
      return useChat((s) => (s && s.navigation && typeof s.navigation.items === 'function' ? s.navigation.items() : NO_ITEMS)) || NO_ITEMS;
    }

    function Canvas(props) {
      const { sessionId, useChat, inputActions, openView } = props;
      const turns = useTurns(useChat);
      const chat = typeof useChat === 'function' ? useChat((s) => s) : null;
      const [meta, setMeta] = useState(() => load(sessionId));
      const [selected, setSelected] = useState(null);
      const [draft, setDraft] = useState('');
      const [notice, setNotice] = useState('');
      const metaRef = useRef(meta);
      metaRef.current = meta;
      const rootRef = useRef(null);
      const [height, setHeight] = useState(520);
      const [view, setView] = useState({ x: 0, y: 0, k: 1 });
      const drag = useRef(null);
      // Resizable detail panel width (persisted).
      const SIDE_KEY = 'dialogue-mindmap:side-width';
      const [sideW, setSideW] = useState(() => { try { const v = parseInt(localStorage.getItem(SIDE_KEY) || '', 10); return v >= 260 ? v : 380; } catch (e) { return 380; } });
      const [resizing, setResizing] = useState(false);
      const resizeRef = useRef(null);
      const clampW = (w) => { const box = rootRef.current ? rootRef.current.getBoundingClientRect().width : window.innerWidth; return Math.round(Math.max(260, Math.min(w, Math.max(260, box - 200)))); };
      const onResizeDown = (e) => {
        if (e.button !== 0) return;
        e.preventDefault(); e.stopPropagation();
        resizeRef.current = { sx: e.clientX, w: sideW };
        e.currentTarget.setPointerCapture(e.pointerId);
        setResizing(true);
        document.body.style.userSelect = 'none';
      };
      const onResizeMove = (e) => {
        const r = resizeRef.current; if (!r) return;
        setSideW(clampW(r.w + (r.sx - e.clientX)));
      };
      const onResizeUp = (e) => {
        if (!resizeRef.current) return;
        resizeRef.current = null;
        setResizing(false);
        document.body.style.userSelect = '';
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
        setSideW((w) => { try { localStorage.setItem(SIDE_KEY, String(w)); } catch (err) {} return w; });
      };

      // Hide the resident composer while the canvas view is shown; size the canvas to the viewport.
      useEffect(() => {
        const el = rootRef.current;
        if (!el) return;
        const body = el.closest('[data-conversation-content]');
        const seat = body && body.querySelector('[data-composer-seat]');
        const prev = seat ? seat.style.display : '';
        if (seat) seat.style.display = 'none';
        const fit = () => { const top = el.getBoundingClientRect().top; setHeight(Math.max(320, window.innerHeight - top - 8)); };
        fit();
        const t = setTimeout(fit, 50);
        window.addEventListener('resize', fit);
        return () => { clearTimeout(t); window.removeEventListener('resize', fit); if (seat) seat.style.display = prev; };
      }, [sessionId]);

      const onPointerDown = (e) => {
        if (e.button !== 0 || e.target.closest('[data-mm-node],[data-mm-tool]')) return;
        drag.current = { sx: e.clientX, sy: e.clientY, x: view.x, y: view.y, moved: false };
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.style.cursor = 'grabbing';
      };
      const onPointerMove = (e) => {
        const d = drag.current; if (!d) return;
        const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
        if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
        setView((v) => ({ ...v, x: d.x + dx, y: d.y + dy }));
      };
      const onPointerUp = (e) => {
        const d = drag.current; drag.current = null;
        e.currentTarget.style.cursor = 'grab';
        if (d && !d.moved) setSelected(null);
      };
      const onWheel = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        setView((v) => {
          const k = Math.min(2.5, Math.max(0.25, v.k * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
          return { k, x: mx - (mx - v.x) * (k / v.k), y: my - (my - v.y) * (k / v.k) };
        });
      };
      const zoom = (f) => setView((v) => ({ ...v, k: Math.min(2.5, Math.max(0.25, v.k * f)) }));

      useEffect(() => { setMeta(load(sessionId)); setSelected(null); }, [sessionId]);
      const update = (fn) => setMeta((old) => { const next = fn({ parents: {}, pending: [], ...old }); save(sessionId, next); return next; });

      // Assign parents for turns we have not placed yet.
      useEffect(() => {
        const m = { parents: {}, pending: [], ...metaRef.current };
        let changed = false;
        const parents = { ...m.parents };
        let pending = m.pending.slice();
        // 1) Match pending expansions by marker, even if the turn was already auto-placed
        //    (a fresh turn can surface before its user text loads, with an empty prompt).
        pending = pending.filter((p) => {
          const t = turns.find((x) => String(x.prompt || '').includes(p.marker));
          if (!t) return true;
          parents[String(t.turn)] = p.parent; changed = true; return false;
        });
        // 2) Drop stale pending entries (send failed / never arrived) after 30 minutes.
        const now = Date.now();
        pending = pending.filter((p) => {
          const ts = parseInt(String(p.marker).split('#')[1] || '', 36);
          const keep = !(ts > 0) || now - ts < 30 * 60 * 1000;
          if (!keep) changed = true;
          return keep;
        });
        let prev = null;
        for (const t of turns) {
          const key = String(t.turn);
          if (!(key in parents)) {
            parents[key] = prev === null ? null : String(prev);
            changed = true;
          }
          prev = t.turn;
        }
        if (changed) update(() => ({ ...m, parents, pending }));
      }, [turns]);

      const tree = useMemo(() => {
        const parents = (meta && meta.parents) || {};
        const nodes = new Map();
        turns.forEach((t) => nodes.set(String(t.turn), { id: String(t.turn), turn: t, children: [] }));
        const pending = ((meta && meta.pending) || []).map((p, i) => ({ id: 'p' + i, pending: p, children: [] }));
        const roots = [];
        for (const n of nodes.values()) {
          const pid = parents[n.id];
          const p = pid != null ? nodes.get(String(pid)) : undefined;
          (p ? p.children : roots).push(n);
        }
        for (const n of pending) { const p = nodes.get(String(n.pending.parent)); if (p) p.children.push(n); }
        // tidy horizontal layout
        let row = 0; const pos = new Map(); let maxDepth = 0;
        const place = (n, depth) => {
          maxDepth = Math.max(maxDepth, depth);
          let y;
          if (!n.children.length) { y = row * (NODE_H + GAP_Y); row++; }
          else { const ys = n.children.map((c) => place(c, depth + 1)); y = (ys[0] + ys[ys.length - 1]) / 2; }
          pos.set(n.id, { x: PAD + depth * (NODE_W + GAP_X), y: PAD + y });
          return y;
        };
        roots.forEach((r) => place(r, 0));
        const all = [...nodes.values(), ...pending.filter((p) => nodes.has(String(p.pending.parent)))];
        const edges = [];
        all.forEach((n) => n.children.forEach((c) => edges.push([n.id, c.id])));
        return { all, pos, edges, width: PAD * 2 + (maxDepth + 1) * (NODE_W + GAP_X), height: PAD * 2 + Math.max(1, row) * (NODE_H + GAP_Y) };
      }, [turns, meta]);

      const sel = selected && turns.find((t) => String(t.turn) === selected);
      // Full (un-truncated) texts of the selected turn, read from the chat node store.
      const full = useMemo(() => {
        const out = { prompt: '', response: '' };
        if (!sel || !chat || !chat.locations || !chat.nodes) return out;
        try {
          const keys = chat.locations.getTurn(sel.turn) || [];
          const prompts = [], answers = [];
          for (const k of keys) {
            const n = chat.nodes.get(k);
            if (!n || !n.data) continue;
            if (n.kind === 'user' && Array.isArray(n.data.content)) n.data.content.forEach((b) => { if (b && b.type === 'text' && b.text) prompts.push(b.text); });
            else if (n.kind === 'assistant-step' && Array.isArray(n.data.blocks)) n.data.blocks.forEach((b) => { if (b && b.kind === 'text' && b.text && b.text.trim()) answers.push(b.text.trim()); });
          }
          out.prompt = prompts.join('\n');
          out.response = answers.join('\n\n');
        } catch (e) { /* fall back to previews */ }
        return out;
      }, [sel && sel.turn, sel && sel.response, chat]);

      const expand = () => {
        const q = draft.trim();
        if (!q || !sel) return;
        if (!inputActions || typeof inputActions.setDraft !== 'function' || typeof inputActions.submit !== 'function') { setNotice('当前会话无法发送消息。'); return; }
        const marker = MARK + '#' + Date.now().toString(36);
        const ctxLine = `${marker} 基于第 ${sel.turn} 轮「${clip(stripMark(sel.prompt), 60)}」的回答继续拓展：`;
        update((m) => ({ ...m, pending: m.pending.concat({ parent: String(sel.turn), marker, question: q }) }));
        inputActions.setDraft(ctxLine + '\n' + q);
        setTimeout(() => inputActions.submit(), 60);
        setDraft('');
        setNotice('已在本会话中发送，新节点会挂到所选节点下。');
      };

      if (!turns.length) return h('div', { ref: rootRef, style: { ...S.root, height } }, h('div', { style: S.empty }, '这个会话还没有对话轮次，先在「对话」里发一条消息。'));

      const canExpand = !!draft.trim();
      return h('div', { ref: rootRef, style: { ...S.root, height } },
        h('div', { style: S.board, onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onWheel },
          h('div', { style: { position: 'absolute', left: 0, top: 0, width: tree.width, height: tree.height, transformOrigin: '0 0', transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` } },
            h('svg', { style: S.lines, width: tree.width, height: tree.height },
              tree.edges.map(([a, b]) => {
                const p = tree.pos.get(a), q = tree.pos.get(b);
                if (!p || !q) return null;
                const x1 = p.x + NODE_W, y1 = p.y + NODE_H / 2, x2 = q.x, y2 = q.y + NODE_H / 2, mx = (x1 + x2) / 2;
                return h('path', { key: a + '-' + b, d: `M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`, fill: 'none', stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 2 });
              })),
            tree.all.map((n) => {
              const p = tree.pos.get(n.id); if (!p) return null;
              if (n.pending) return h('div', { key: n.id, 'data-mm-node': '', style: { ...S.node, ...S.nodePending, left: p.x, top: p.y } },
                h('div', { style: S.tag }, '等待回答…'), h('div', { style: S.prompt }, clip(n.pending.question, 40)));
              const t = n.turn;
              const isRoot = !(meta.parents && meta.parents[n.id] != null);
              return h('div', { key: n.id, 'data-mm-node': '', title: stripMark(t.prompt), onClick: (e) => { e.stopPropagation(); setSelected(n.id); setNotice(''); },
                style: { ...S.node, ...(isRoot ? S.nodeRoot : {}), ...(selected === n.id ? S.nodeSel : {}), left: p.x, top: p.y } },
                h('div', { style: S.tag }, `第 ${t.turn} 轮${n.children.length ? ` · ${n.children.length} 个分支` : ''}`),
                h('div', { style: S.prompt }, clip(stripMark(t.prompt), 40) || '（无文本）'),
                h('div', { style: S.resp }, clip(t.response, 90) || '…'));
            })),
          h('div', { style: S.tools, 'data-mm-tool': '' },
            h('button', { style: S.tool, title: '缩小', onClick: () => zoom(1 / 1.2) }, '－'),
            h('button', { style: S.tool, title: '复位', onClick: () => setView({ x: 0, y: 0, k: 1 }) }, `${Math.round(view.k * 100)}%`),
            h('button', { style: S.tool, title: '放大', onClick: () => zoom(1.2) }, '＋'))),
        sel && h('aside', { style: { ...S.side, width: sideW, position: 'relative' } },
          h('div', {
            title: '拖拽调整宽度（双击恢复默认）',
            style: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, cursor: 'col-resize', zIndex: 5, background: resizing ? 'var(--dsw-alias-border-l2)' : 'transparent' },
            onPointerDown: onResizeDown, onPointerMove: onResizeMove, onPointerUp: onResizeUp, onPointerCancel: onResizeUp,
            onDoubleClick: () => { setSideW(380); try { localStorage.setItem(SIDE_KEY, '380'); } catch (e) {} },
          }),
          h('div', { style: S.h }, `第 ${sel.turn} 轮`),
          h('div', { style: S.text }, stripMark(full.prompt || sel.prompt) || '（无文本）'),
          h('div', { style: S.h }, '回答'),
          h('div', { style: S.answer, onWheel: (e) => e.stopPropagation() }, full.response || sel.response || '（暂无）'),
          typeof openView === 'function' && h('button', { type: 'button', style: S.btn2, onClick: () => openView('chat') }, '在「对话」中查看'),
          h('div', { style: S.h }, '从这里拓展子节点'),
          h('textarea', { style: S.area, value: draft, placeholder: '输入要围绕此节点追问的问题…', onChange: (e) => setDraft(e.target.value),
            onKeyDown: (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) expand(); } }),
          h('button', { type: 'button', style: { ...S.btn, ...(canExpand ? {} : S.btnOff) }, onClick: expand, disabled: !canExpand },
            h('span', { style: { color: 'inherit', WebkitTextFillColor: 'inherit' } }, '＋ 拓展子节点（Ctrl+Enter）')),
          notice && h('div', { style: S.tag }, notice)));
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view', id: 'dialogue-mindmap', order: 1, label: '画布',
        }, Canvas));
      },
    };
  },
});
