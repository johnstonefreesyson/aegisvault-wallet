import React, { useState } from 'react';
import { ChevronLeft, Plus, Trash2, Pencil, Copy, Search } from 'lucide-react';
import { ethers } from 'ethers';
import { useWallet } from '../../store/WalletContext';

export const ContactsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { contacts, saveContact, removeContact, showToast } = useWallet();
  const [editing, setEditing] = useState<{ id?: string; name: string; address: string } | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const filtered = contacts.filter(
    (c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.address.toLowerCase().includes(query.toLowerCase())
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const address = editing.address.trim();
    if (!editing.name.trim()) return setError('Give this contact a name.');
    if (!ethers.isAddress(address)) return setError('Enter a valid EVM address.');
    const dupe = contacts.find((c) => c.address.toLowerCase() === address.toLowerCase() && c.id !== editing.id);
    if (dupe) return setError(`Already saved as "${dupe.name}".`);
    saveContact({ id: editing.id, name: editing.name, address: ethers.getAddress(address) });
    showToast('Contact saved', 'success');
    setEditing(null);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 page-wash md:px-10 lg:px-[10%] overflow-y-auto px-5 pt-5 pb-8">
      <div className="relative flex items-center justify-center h-10 mb-4">
        <button onClick={onBack} aria-label="Back" className="absolute left-0 p-2 -ml-2 text-ink/70 hover:text-ink">
          <ChevronLeft size={22} />
        </button>
        <span className="text-sm text-ink/80">Address Book</span>
        <button
          onClick={() => {
            setEditing({ name: '', address: '' });
            setError('');
          }}
          aria-label="Add contact"
          className="absolute right-0 p-2 -mr-2 text-coral"
        >
          <Plus size={20} />
        </button>
      </div>

      {editing && (
        <form onSubmit={submit} className="mb-4 p-4 rounded-3xl bg-card space-y-3">
          {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
          <input
            autoFocus
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            placeholder="Name"
            className="w-full px-4 py-3 rounded-2xl bg-white text-sm text-ink placeholder-muted focus:outline-none"
          />
          <input
            value={editing.address}
            onChange={(e) => setEditing({ ...editing, address: e.target.value })}
            placeholder="0x… address"
            spellCheck={false}
            className="w-full px-4 py-3 rounded-2xl bg-white text-xs font-mono text-ink placeholder-muted focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setEditing(null)} className="btn-secondary !bg-white">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      )}

      {contacts.length > 5 && (
        <div className="relative mb-3">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts"
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card text-sm text-ink placeholder-muted focus:outline-none"
          />
        </div>
      )}

      {contacts.length === 0 && !editing ? (
        <div className="py-16 text-center text-sm text-muted">
          No contacts yet. Save addresses you send to often. They'll show up when you send.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3 rounded-3xl bg-card">
              <span className="w-10 h-10 rounded-full bg-navy text-white text-sm font-semibold flex items-center justify-center shrink-0">
                {c.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] text-ink truncate">{c.name}</div>
                <div className="text-xs text-muted font-mono truncate">{c.address.slice(0, 10)}…{c.address.slice(-8)}</div>
              </div>
              <button
                aria-label={`Copy ${c.name}'s address`}
                onClick={() => {
                  navigator.clipboard?.writeText(c.address);
                  showToast('Address copied', 'success');
                }}
                className="p-2 text-muted hover:text-ink"
              >
                <Copy size={15} />
              </button>
              <button aria-label={`Edit ${c.name}`} onClick={() => setEditing({ id: c.id, name: c.name, address: c.address })} className="p-2 text-muted hover:text-ink">
                <Pencil size={15} />
              </button>
              <button
                aria-label={`Delete ${c.name}`}
                onClick={() => {
                  if (window.confirm(`Delete ${c.name}?`)) removeContact(c.id);
                }}
                className="p-2 text-muted hover:text-rose-600"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
