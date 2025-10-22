'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiPost } from '@smartseat/utils';

type Table = {
  id: string;
  name: string;
  shape: 'round' | 'rect';
  capacity: number;
  zone: string | null;
  locked: boolean;
  pos: { x: number; y: number; angle?: number };
};

type Guest = {
  id: string;
  fullName: string;
  group?: string | null;
  tags: string[];
};

type Assignment = {
  tableId: string;
  guestId: string;
  seatIndex: number;
  locked?: boolean;
};

type PlanDTO = {
  tables: Table[];
  guests: Guest[];
  assignments: Assignment[];
};

function classNames(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(' ');
}

export default function PlannerPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [data, setData] = useState<PlanDTO | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // History stack for undo / redo
  const hist = useRef<{ assigns: Assignment[]; tables: Table[] }[]>([]);
  const redo = useRef<typeof hist.current>([]);

  // Currently dragged guest id (from list or seat)
  const [dragGuestId, setDragGuestId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [projectId]);

  async function load() {
    setMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/plan`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'load failed');
      setData(json.data as PlanDTO);
      hist.current = [{ assigns: json.data.assignments, tables: json.data.tables }];
      redo.current = [];
    } catch (e: any) {
      setMsg(e.message ?? 'failed');
    }
  }

  const assignedBySeat = useMemo(() => {
    const map = new Map<string, Map<number, string>>();
    data?.assignments.forEach((a) => {
      if (!map.has(a.tableId)) map.set(a.tableId, new Map());
      map.get(a.tableId)!.set(a.seatIndex, a.guestId);
    });
    return map;
  }, [data?.assignments]);

  const occupiedGuestIds = useMemo(
    () => new Set(data?.assignments.map((a) => a.guestId) ?? []),
    [data?.assignments]
  );

  const unseatedGuests = useMemo(
    () => (data?.guests ?? []).filter((g) => !occupiedGuestIds.has(g.id)),
    [data?.guests, occupiedGuestIds]
  );

  function pushHistory() {
    if (!data) return;
    hist.current.push({
      assigns: structuredClone(data.assignments),
      tables: structuredClone(data.tables),
    });
    if (hist.current.length > 50) hist.current.shift();
    redo.current = [];
  }

  function onUndo() {
    if (hist.current.length <= 1 || !data) return;
    const current = hist.current.pop()!;
    redo.current.push(current);
    const prev = hist.current[hist.current.length - 1];
    setData({
      ...data,
      assignments: structuredClone(prev.assigns),
      tables: structuredClone(prev.tables),
    });
  }

  function onRedo() {
    if (!redo.current.length || !data) return;
    const nextState = redo.current.pop()!;
    hist.current.push(nextState);
    setData({
      ...data,
      assignments: structuredClone(nextState.assigns),
      tables: structuredClone(nextState.tables),
    });
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

  function onDragTableStart(e: React.MouseEvent, tableId: string) {
    if (!data) return;
    const table = data.tables.find((t) => t.id === tableId);
    if (!table || table.locked) return;
    e.preventDefault();
    pushHistory();
    const start = { x: e.clientX, y: e.clientY, ox: table.pos.x, oy: table.pos.y };
    let latestTables = data.tables;

    function move(ev: MouseEvent) {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      const nx = Math.max(0, Math.round((start.ox + dx) / 10) * 10);
      const ny = Math.max(0, Math.round((start.oy + dy) / 10) * 10);
      latestTables = latestTables.map((t) =>
        t.id === tableId ? { ...t, pos: { ...t.pos, x: nx, y: ny } } : t
      );
      setData((prev) => (prev ? { ...prev, tables: latestTables } : prev));
    }

    function up() {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      setData((prev) => (prev ? { ...prev, tables: latestTables } : prev));
    }

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }

  function onDropGuestToSeat(guestId: string, tableId: string, seatIndex: number) {
    if (!data) return;
    const targetTable = data.tables.find((t) => t.id === tableId);
    if (!targetTable || targetTable.locked) return;

    const next = data.assignments.map((a) => ({ ...a }));
    const targetIndex = next.findIndex((a) => a.tableId === tableId && a.seatIndex === seatIndex);
    const originIndex = next.findIndex((a) => a.guestId === guestId);
    const targetAssignment = targetIndex >= 0 ? next[targetIndex] : null;
    const originAssignment = originIndex >= 0 ? next[originIndex] : null;

    if (originAssignment) {
      const originTable = data.tables.find((t) => t.id === originAssignment.tableId);
      if (originTable?.locked) {
        if (originAssignment.tableId === tableId && originAssignment.seatIndex === seatIndex) return;
        return;
      }
      if (originAssignment.tableId === tableId && originAssignment.seatIndex === seatIndex) return;

      if (targetAssignment) {
        next.splice(targetIndex, 1);
      }

      originAssignment.tableId = tableId;
      originAssignment.seatIndex = seatIndex;
    } else {
      if (targetAssignment) {
        next.splice(targetIndex, 1);
      }
      next.push({ tableId, seatIndex, guestId });
    }

    setAssignments(next);
  }

  function unassignSeat(tableId: string, seatIndex: number) {
    if (!data) return;
    const table = data.tables.find((t) => t.id === tableId);
    if (table?.locked) return;
    setAssignments(data.assignments.filter((a) => !(a.tableId === tableId && a.seatIndex === seatIndex)));
  }

  async function saveAll() {
    if (!data) return;
    setMsg(null);
    try {
      await apiPost<void>(`/api/projects/${projectId}/plan`, {
        tables: data.tables.map((t) => ({ id: t.id, pos: t.pos, locked: t.locked })),
        assignments: data.assignments,
      });
      alert('Saved');
    } catch (e: any) {
      setMsg(e.message ?? 'failed');
    }
  }

  function autoPlaceFill() {
    if (!data) return;
    const next = data.assignments.slice();
    const occupied = new Set(next.map((a) => a.guestId));
    const queue = (data.guests ?? []).filter((g) => !occupied.has(g.id));
    if (!queue.length) return;
    for (const table of data.tables) {
      if (table.locked) continue;
      for (let seat = 0; seat < table.capacity; seat++) {
        const has = next.find((a) => a.tableId === table.id && a.seatIndex === seat);
        if (!has && queue.length) {
          next.push({ tableId: table.id, seatIndex: seat, guestId: queue.shift()!.id });
        }
      }
    }
    setAssignments(next);
  }

  if (!data) {
    return (
      <div className="space-y-3">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button className="px-3 py-2 rounded bg-white/10 hover:bg-white/20" onClick={onUndo}>
          Undo
        </button>
        <button className="px-3 py-2 rounded bg-white/10 hover:bg-white/20" onClick={onRedo}>
          Redo
        </button>
        <button className="px-3 py-2 rounded bg-white/10 hover:bg-white/20" onClick={autoPlaceFill}>
          Auto place
        </button>
        <button className="px-3 py-2 rounded bg-emerald-600/60 hover:bg-emerald-600/70" onClick={saveAll}>
          Save
        </button>
        {msg && <span className="text-red-300 text-sm">{msg}</span>}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <div
            className="rounded bg-white/5 p-3 space-y-2 min-h-[500px] border-2 border-dashed border-transparent hover:border-white/30 transition-colors"
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('border-emerald-500/50', 'bg-emerald-500/5');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('border-emerald-500/50', 'bg-emerald-500/5');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-emerald-500/50', 'bg-emerald-500/5');
              if (dragGuestId) {
                const assignment = data.assignments.find((a) => a.guestId === dragGuestId);
                if (assignment) unassignSeat(assignment.tableId, assignment.seatIndex);
              }
            }}
          >
            <div className="font-semibold flex items-center gap-2">
              <span>Unseated Guests ({unseatedGuests.length})</span>
              <span className="text-xs opacity-60">Drag here to unassign</span>
            </div>
            <ul className="space-y-2">
              {unseatedGuests.map((guest) => (
                <li
                  key={guest.id}
                  className={classNames(
                    'rounded px-3 py-2 bg-white/10 cursor-grab active:cursor-grabbing hover:bg-white/15',
                    dragGuestId === guest.id && 'ring-2 ring-white/50 opacity-50'
                  )}
                  draggable
                  onDragStart={() => setDragGuestId(guest.id)}
                  onDragEnd={() => setDragGuestId(null)}
                >
                  {guest.fullName}{' '}
                  {guest.group ? <span className="opacity-60 text-xs ml-1">[{guest.group}]</span> : null}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="col-span-9">
          <div className="relative h-[640px] rounded bg-white/5 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(transparent,_transparent_9px,_rgba(255,255,255,0.06)_10px),linear-gradient(90deg,transparent,_transparent_9px,_rgba(255,255,255,0.06)_10px)] bg-[size:10px_10px]" />
            {data.tables.map((table) => (
              <div
                key={table.id}
                className="absolute select-none"
                style={{
                  left: table.pos.x,
                  top: table.pos.y,
                  width: 140,
                  transform: `rotate(${table.pos.angle ?? 0}deg)`,
                }}
              >
                <div
                  className={classNames(
                    'rounded-t px-2 py-1 text-sm font-medium flex items-center justify-between cursor-move',
                    table.locked ? 'bg-amber-700/60' : 'bg-white/15 hover:bg-white/20'
                  )}
                  onMouseDown={(e) => {
                    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
                    onDragTableStart(e, table.id);
                  }}
                >
                  <span title={table.id}>{table.name}</span>
                  <button
                    className="text-xs underline px-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      pushHistory();
                      setData({
                        ...data,
                        tables: data.tables.map((t) =>
                          t.id === table.id ? { ...t, locked: !t.locked } : t
                        ),
                      });
                    }}
                  >
                    {table.locked ? 'Unlock' : 'Lock'}
                  </button>
                </div>

                <div
                  className={classNames('rounded-b bg-white/10 p-2', table.shape === 'round' ? 'rounded-b-full' : '')}
                  style={{ width: 140, height: table.shape === 'round' ? 140 : 90 }}
                >
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: table.capacity }).map((_, seatIdx) => {
                      const occupant = assignedBySeat.get(table.id)?.get(seatIdx);
                      return (
                        <div
                          key={seatIdx}
                          className={classNames(
                            'h-8 rounded flex items-center justify-center text-[11px]',
                            table.locked
                              ? 'bg-white/10 cursor-not-allowed opacity-60'
                              : occupant
                              ? 'bg-emerald-600/50 hover:bg-emerald-600/60 cursor-grab active:cursor-grabbing'
                              : 'bg-white/10 hover:bg-white/20 cursor-pointer'
                          )}
                          draggable={!!occupant && !table.locked}
                          onDragStart={(e) => {
                            if (!occupant || table.locked) {
                              e.preventDefault();
                            } else {
                              setDragGuestId(occupant);
                            }
                          }}
                          onDragEnd={() => setDragGuestId(null)}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (occupant && !table.locked) unassignSeat(table.id, seatIdx);
                          }}
                          onDragOver={(e) => {
                            if (table.locked) return;
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            if (table.locked) return;
                            e.preventDefault();
                            e.stopPropagation();
                            if (dragGuestId) onDropGuestToSeat(dragGuestId, table.id, seatIdx);
                          }}
                        >
                          {occupant ? data.guests.find((g) => g.id === occupant)?.fullName ?? 'Occupied' : seatIdx + 1}
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
