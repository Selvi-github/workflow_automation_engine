import React from 'react';
import { Plus, Trash2, GripVertical, List } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableField = ({ field, updateField, removeField }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} className="flex flex-col md:flex-row gap-6 items-start md:items-center glass-card !p-6 group mb-4 border-white/5 hover:border-emerald-500/20 transition-all duration-500">
            <div className="cursor-grab text-zinc-700 group-hover:text-emerald-500/50 hidden md:block transition-colors" {...attributes} {...listeners}>
                <GripVertical size={22} strokeWidth={2.5} />
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
                <div>
                    <label className="text-[10px] font-black text-dim uppercase tracking-[0.3em] block mb-3 opacity-60">Field Name</label>
                    <input type="text" value={field.name} onChange={e => updateField(field.id, 'name', e.target.value)} className="input-glass w-full !bg-zinc-950/40" placeholder="e.g. amount" />
                </div>
                <div>
                    <label className="text-[10px] font-black text-dim uppercase tracking-[0.3em] block mb-3 opacity-60">Type</label>
                    <select value={field.type} onChange={e => updateField(field.id, 'type', e.target.value)} className="input-glass w-full cursor-pointer !bg-zinc-950/40">
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-dim uppercase tracking-[0.3em] block mb-3 opacity-60">Allowed Values</label>
                    <input type="text" value={field.allowed_values ? field.allowed_values.join(', ') : ''} onChange={e => updateField(field.id, 'allowed_values', e.target.value ? e.target.value.split(',').map(v => v.trim()) : null)} className="input-glass w-full font-mono text-[11px] !bg-zinc-950/40" placeholder="Comma separated..." />
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-4 cursor-pointer mt-8 group/check">
                        <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all duration-500 ${field.required ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'border-white/10 group-hover/check:border-emerald-500/30'}`}>
                            {field.required && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                        </div>
                        <input type="checkbox" className="hidden" checked={field.required} onChange={e => updateField(field.id, 'required', e.target.checked)} />
                        <span className="text-[11px] font-black text-zinc-500 group-hover/check:text-zinc-200 uppercase tracking-widest transition-colors">Required</span>
                    </label>
                </div>
            </div>
            <button onClick={() => removeField(field.id)} className="text-zinc-700 hover:text-rose-500 p-3 mt-4 md:mt-6 transition-all hover:scale-125 active:scale-90">
                <Trash2 size={20} />
            </button>
        </div>
    );
};

const SchemaBuilder = ({ fields, setFields }) => {
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleAddField = () => setFields([...fields, { id: `field-${Date.now()}`, name: '', type: 'string', required: false, allowed_values: null }]);
    const updateField = (fId, key, value) => setFields(fields.map(f => f.id === fId ? { ...f, [key]: value } : f));
    const removeField = (fId) => setFields(fields.filter(f => f.id !== fId));
    
    const handleDragEnd = (e) => {
        if (e.active.id !== e.over.id) {
            const oldIdx = fields.findIndex(f => f.id === e.active.id);
            const newIdx = fields.findIndex(f => f.id === e.over.id);
            setFields(arrayMove(fields, oldIdx, newIdx));
        }
    };

    return (
        <div className="glass p-12 rounded-[3.5rem] space-y-12 border border-white/5 relative overflow-hidden mesh-gradient">
            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-4 glass-emerald rounded-[1.5rem] shadow-xl">
                        <List className="text-emerald-400" size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-main tracking-tighter uppercase">Payload Schema</h2>
                        <p className="text-[10px] font-black text-dim tracking-[0.4em] uppercase opacity-50 mt-1">Data Model Architecture</p>
                    </div>
                </div>
                <button onClick={handleAddField} className="btn-emerald !py-3 !px-6 !rounded-2xl group/plus">
                    <Plus size={20} strokeWidth={3} className="group-hover/plus:rotate-90 transition-transform duration-500" />
                    <span className="uppercase tracking-widest text-[11px] font-black">Inject Attribute</span>
                </button>
            </div>

            <div className="relative z-10">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={fields.map(f=>f.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {fields.length === 0 ? (
                                <div className="py-24 text-center glass rounded-[3rem] border-2 border-dashed border-white/5 font-black text-zinc-800 text-sm uppercase tracking-[0.5em] mesh-gradient">
                                    No protocol data defined
                                </div>
                            ) : (
                                fields.map((field) => (
                                    <SortableField key={field.id} field={field} updateField={updateField} removeField={removeField} />
                                ))
                            )}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
};

export default SchemaBuilder;
