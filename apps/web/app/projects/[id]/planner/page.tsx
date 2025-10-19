'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

type Table = { id: string; name: string; shape: 'round'|'rect'; capacity: number; zone: string|null; locked: boolean; pos: {x:number;y:number;angle?:number} };
type Guest = { id: string; fullName: string; group?: string|null; tags: string[] };
type Assignment = { tableId: string; guestId: string; seatIndex: number; locked?: boolean };

type PlanDTO = { tables: Table[]; guests: Guest[]; assignments: Assignment[] };

function classNames(...xs:(string|false|undefined)[]) { return xs.filter(Boolean).join(' '); }

export default function PlannerPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [data, setData] = useState<PlanDTO | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // 历史栈（撤销/重做）
  const hist = useRef<{ assigns: Assignment[]; tables: Table[] }[]>([]);
  const redo = useRef<typeof hist.current>([]);

  // 选中态：选中的来宾ID（用于点击席位交换）
  const [dragGuestId, setDragGuestId] = useState<string | null>(null);

  useEffect(() => { load(); }, [projectId]);
  async function load() {
    setMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/plan`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'load failed');
      setData(json.data as PlanDTO);
      hist.current = [{ assigns: json.data.assignments, tables: json.data.tables }];
      redo.current = [];
    } catch (e:any) { setMsg(e.message ?? 'failed'); }
  }

  const assignedBySeat = useMemo(() => {
    const m = new Map<string, Map<number, string>>(); // tableId -> seat -> guestId
    data?.assignments.forEach(a => {
      if (!m.has(a.tableId)) m.set(a.tableId, new Map());
      m.get(a.tableId)!.set(a.seatIndex, a.guestId);
    });
    return m;
  }, [data?.assignments]);

  const occupiedGuestIds = useMemo(
    () => new Set(data?.assignments.map(a => a.guestId) ?? []),
    [data?.assignments]
  );
  const unseatedGuests = useMemo(
    () => (data?.guests ?? []).filter(g => !occupiedGuestIds.has(g.id)),
    [data?.guests, occupiedGuestIds]
  );

  function pushHistory() {
    if (!data) return;
    hist.current.push({ assigns: structuredClone(data.assignments), tables: structuredClone(data.tables) });
    if (hist.current.length > 50) hist.current.shift();
    redo.current = [];
  }

  function onUndo() {
    if (hist.current.length <= 1 || !data) return;
    const cur = hist.current.pop()!;
    redo.current.push(cur);
    const prev = hist.current[hist.current.length - 1];
    setData({ ...data, assignments: structuredClone(prev.assigns), tables: structuredClone(prev.tables) });
  }

  function onRedo() {
    if (!redo.current.length || !data) return;
    const nx = redo.current.pop()!;
    hist.current.push(nx);
    setData({ ...data, assignments: structuredClone(nx.assigns), tables: structuredClone(nx.tables) });
  }

  function setAssignments(next: Assignment[]) {
    if (!data) return;
    pushHistory();
    setData({ ...data, assignments: next });
  }
  function setTables(next: Table[]) {
    if (!data) return;
    pushHistory();
    setData({ ...data, tables: next });
  }

  // 拖动桌子
  function onDragTableStart(e: React.MouseEvent, tid: string) {
    if (!data) return;
    const t = data.tables.find(x => x.id === tid)!;
    if (t.locked) return;
    e.preventDefault();
    pushHistory(); // 拖动开始时记录历史
    const start = { x: e.clientX, y: e.clientY, ox: t.pos.x, oy: t.pos.y };
    let latestTables = data.tables;
    function move(ev: MouseEvent) {
      const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
      const nx = Math.max(0, Math.round((start.ox + dx) / 10) * 10);
      const ny = Math.max(0, Math.round((start.oy + dy) / 10) * 10);
      latestTables = latestTables.map(tb => tb.id === tid ? { ...tb, pos: { ...tb.pos, x: nx, y: ny } } : tb);
      setData(d => d ? { ...d, tables: latestTables } : d);
    }
    function up() { 
      window.removeEventListener('mousemove', move); 
      window.removeEventListener('mouseup', up);
      // 使用最新的 tables 状态
      setData(d => d ? { ...d, tables: latestTables } : d);
    }
    window.addEventListener('mousemove', move); 
    window.addEventListener('mouseup', up);
  }

  // 选择/拖拽来宾并投放到席位
  function onDropGuestToSeat(guestId: string, tableId: string, seatIndex: number) {
    if (!data) return;
    const cur = new Map(data.assignments.map(a => [`${a.tableId}:${a.seatIndex}`, a] as const));
    const key = `${tableId}:${seatIndex}`;
    const existing = cur.get(key);
    // 查 guest 现在在哪
    const from = data.assignments.find(a => a.guestId === guestId);
    const next = data.assignments.slice();

    if (existing && from && (existing.guestId !== guestId)) {
      // 交换
      existing.guestId = guestId;
      from.guestId = existing.guestId; // 这行先保存旧值再覆盖，下行修正
      const otherGuest = next.find(a => a.tableId === tableId && a.seatIndex === seatIndex)!;
      const oldFromGuest = from.guestId;
      otherGuest.guestId = guestId;
      from.guestId = oldFromGuest!;
    } else {
      // 普通放置：若 seat 有人则替换；若 guest 有席位则移动；否则新增
      if (existing) {
        existing.guestId = guestId;
      } else if (from) {
        from.tableId = tableId; from.seatIndex = seatIndex;
      } else {
        next.push({ tableId, seatIndex, guestId });
      }
    }
    setAssignments(next);
  }

  function unassignSeat(tableId: string, seatIndex: number) {
    if (!data) return;
    setAssignments(data.assignments.filter(a => !(a.tableId === tableId && a.seatIndex === seatIndex)));
  }

  async function saveAll() {
    if (!data) return;
    setMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/plan`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tables: data.tables.map(t => ({ id: t.id, pos: t.pos, locked: t.locked })),
          assignments: data.assignments
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'save failed');
      alert('已保存');
    } catch (e:any) { setMsg(e.message ?? 'failed'); }
  }

  function autoPlaceFill() {
    if (!data) return;
    const next = data.assignments.slice();
    const occupied = new Set(next.map(a => a.guestId));
    const queue = (data.guests ?? []).filter(g => !occupied.has(g.id));
    if (!queue.length) return;
    for (const t of data.tables) {
      for (let s = 0; s < t.capacity; s++) {
        const has = next.find(a => a.tableId === t.id && a.seatIndex === s);
        if (!has && queue.length) {
          next.push({ tableId: t.id, seatIndex: s, guestId: queue.shift()!.id });
        }
      }
    }
    setAssignments(next);
  }

  if (!data) return <div className="space-y-3">加载中…{msg && <div className="text-red-300 text-sm">{msg}</div>}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button className="px-3 py-2 rounded bg-white/10 hover:bg-white/20" onClick={onUndo}>撤销</button>
        <button className="px-3 py-2 rounded bg-white/10 hover:bg-white/20" onClick={onRedo}>重做</button>
        <button className="px-3 py-2 rounded bg-white/10 hover:bg-white/20" onClick={autoPlaceFill}>自动填充</button>
        <button className="px-3 py-2 rounded bg-emerald-600/60 hover:bg-emerald-600/70" onClick={saveAll}>保存</button>
        {msg && <span className="text-red-300 text-sm">{msg}</span>}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* 左侧：来宾列表（可拖拽） */}
        <div className="col-span-3">
          <div 
            className="rounded bg-white/5 p-3 space-y-2 min-h-[500px] border-2 border-dashed border-transparent hover:border-white/30 transition-colors"
            onDragOver={(e)=> { 
              e.preventDefault();
              e.currentTarget.classList.add('border-emerald-500/50', 'bg-emerald-500/5');
            }}
            onDragLeave={(e)=> {
              e.currentTarget.classList.remove('border-emerald-500/50', 'bg-emerald-500/5');
            }}
            onDrop={(e)=> { 
              e.preventDefault();
              e.currentTarget.classList.remove('border-emerald-500/50', 'bg-emerald-500/5');
              if (dragGuestId) {
                // 从席位拖到未入座区域 = 取消分配
                const assignment = data?.assignments.find(a => a.guestId === dragGuestId);
                if (assignment) {
                  unassignSeat(assignment.tableId, assignment.seatIndex);
                }
              }
            }}
          >
            <div className="font-semibold flex items-center gap-2">
              <span>未入座来宾（{unseatedGuests.length}）</span>
              <span className="text-xs opacity-60">← 拖到这里取消分配</span>
            </div>
            <ul className="space-y-2">
              {unseatedGuests.map(g => (
                <li key={g.id}
                    className={classNames("rounded px-3 py-2 bg-white/10 cursor-grab active:cursor-grabbing hover:bg-white/15", 
                      dragGuestId===g.id && "ring-2 ring-white/50 opacity-50")}
                    draggable
                    onDragStart={() => setDragGuestId(g.id)}
                    onDragEnd={() => setDragGuestId(null)}
                >
                  {g.fullName} {g.group ? <span className="opacity-60 text-xs ml-1">[{g.group}]</span> : null}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 右侧：画布 */}
        <div className="col-span-9">
          <div className="relative h-[640px] rounded bg-white/5 overflow-hidden">
            {/* 网格背景 */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent,_transparent_9px,_rgba(255,255,255,0.06)_10px),linear-gradient(90deg,transparent,_transparent_9px,_rgba(255,255,255,0.06)_10px)] bg-[size:10px_10px]"></div>
            {/* 桌子渲染 */}
            {data.tables.map(t => (
              <div key={t.id}
                   className="absolute select-none"
                   style={{ left: t.pos.x, top: t.pos.y, width: 140, transform: `rotate(${t.pos.angle ?? 0}deg)` }}
              >
                <div
                  className={classNames("rounded-t px-2 py-1 text-sm font-medium flex items-center justify-between cursor-move",
                    t.locked ? "bg-amber-700/60" : "bg-white/15 hover:bg-white/20")}
                  onMouseDown={(e)=>{
                    // 如果点击的是按钮，不触发拖拽
                    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
                    onDragTableStart(e, t.id);
                  }}
                >
                  <span title={t.id}>{t.name}</span>
                  <button
                    className="text-xs underline px-1"
                    onClick={(e)=>{
                      e.stopPropagation();
                      pushHistory();
                      if (t.locked) {
                        setData({ ...data, tables: data.tables.map(x=>x.id===t.id?{...x, locked:false}:x) });
                      } else {
                        setData({ ...data, tables: data.tables.map(x=>x.id===t.id?{...x, locked:true}:x) });
                      }
                    }}
                  >{t.locked?'解锁':'上锁'}</button>
                </div>

                <div className={classNames("rounded-b bg-white/10 p-2", t.shape==='round' ? "rounded-b-full" : "")}
                     style={{ width: 140, height: t.shape==='round'?140:90 }}>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({length:t.capacity}).map((_,i)=>{
                      const occupant = assignedBySeat.get(t.id)?.get(i);
                      return (
                        <div key={i}
                             className={classNames("h-8 rounded flex items-center justify-center text-[11px]",
                               occupant ? "bg-emerald-600/50 hover:bg-emerald-600/60 cursor-grab active:cursor-grabbing" : "bg-white/10 hover:bg-white/20 cursor-pointer")}
                             draggable={!!occupant}
                             onDragStart={(e)=>{ 
                               if (occupant) {
                                 setDragGuestId(occupant);
                               } else {
                                 e.preventDefault();
                               }
                             }}
                             onDragEnd={() => setDragGuestId(null)}
                             onDoubleClick={(e)=>{ 
                               e.stopPropagation(); 
                               if (occupant) {
                                 unassignSeat(t.id, i);
                               }
                             }}
                             onDragOver={(e)=> { e.preventDefault(); e.stopPropagation(); }}
                             onDrop={(e)=>{ 
                               e.preventDefault(); 
                               e.stopPropagation(); 
                               if (dragGuestId) {
                                 onDropGuestToSeat(dragGuestId, t.id, i);
                               }
                             }}
                        >
                          {occupant ? (data.guests.find(g=>g.id===occupant)?.fullName ?? '占用') : i+1}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
