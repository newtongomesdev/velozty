import React, { useState } from "react";
import { X } from "lucide-react";
import { type Profile } from "../../lib/supabase";

interface UserEditModalProps {
  user: Profile;
  onClose: () => void;
  onSave: (id: string, data: Partial<Profile>) => Promise<void>;
}

export function UserEditModal({ user, onClose, onSave }: UserEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: user.display_name || "",
    username: user.username || "",
    city: user.city || "",
    state: user.state || "",
    website: user.website || "",
    bio: user.bio || ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(user.id, formData);
      onClose();
    } catch {
      // Error is handled by parent toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-mutedgray hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
        <h2 className="mb-6 text-lg font-black uppercase tracking-wider text-volt">Editar Usuário</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-mutedgray">Nome</label>
              <input name="display_name" value={formData.display_name} onChange={handleChange} required className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white focus:border-volt focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-mutedgray">Username</label>
              <input name="username" value={formData.username} onChange={handleChange} required className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white focus:border-volt focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-mutedgray">Cidade</label>
              <input name="city" value={formData.city} onChange={handleChange} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white focus:border-volt focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-mutedgray">Estado</label>
              <input name="state" value={formData.state} onChange={handleChange} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white focus:border-volt focus:outline-none" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-mutedgray">Website</label>
            <input name="website" value={formData.website} onChange={handleChange} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white focus:border-volt focus:outline-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-mutedgray">Biografia</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white focus:border-volt focus:outline-none resize-none" />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-white hover:bg-white/5">Cancelar</button>
            <button type="submit" disabled={loading} className="rounded-xl bg-volt px-4 py-2.5 text-xs font-black uppercase text-black hover:bg-[#a3d100] disabled:opacity-50">
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
