import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import type { Contact, ContactDraft } from '../types';
import { newId } from '../types';
import { clearStorage, loadOrSeed, saveContacts } from '../storage/store';
import { seedContacts } from '../storage/seed';

type Action =
  | { type: 'add'; contact: Contact }
  | { type: 'update'; contact: Contact }
  | { type: 'remove'; id: string }
  | { type: 'toggleFavorite'; id: string }
  | { type: 'bulkImport'; contacts: Contact[] }
  | { type: 'clear' }
  | { type: 'reset' };

function reducer(state: Contact[], action: Action): Contact[] {
  switch (action.type) {
    case 'add':
      return [action.contact, ...state];
    case 'update':
      return state.map((c) =>
        c.id === action.contact.id ? { ...action.contact, createdAt: c.createdAt } : c,
      );
    case 'remove':
      return state.filter((c) => c.id !== action.id);
    case 'toggleFavorite':
      return state.map((c) => (c.id === action.id ? { ...c, favorite: !c.favorite } : c));
    case 'bulkImport':
      return [...action.contacts, ...state];
    case 'clear':
      return [];
    case 'reset':
      return seedContacts();
    default:
      return state;
  }
}

export interface ContactsContextValue {
  contacts: Contact[];
  addContact: (draft: ContactDraft) => Contact;
  updateContact: (id: string, draft: ContactDraft) => void;
  removeContact: (id: string) => void;
  toggleFavorite: (id: string) => void;
  importContacts: (contacts: Contact[]) => void;
  clearContacts: () => void;
  resetDemo: () => void;
}

const ContactsContext = createContext<ContactsContextValue | null>(null);

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [contacts, dispatch] = useReducer(reducer, undefined, loadOrSeed);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => saveContacts(contacts), 300);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [contacts]);

  const addContact = useCallback((draft: ContactDraft): Contact => {
    const timestamp = new Date().toISOString();
    const contact: Contact = { ...draft, id: newId(), createdAt: timestamp, updatedAt: timestamp };
    dispatch({ type: 'add', contact });
    return contact;
  }, []);

  const updateContact = useCallback((id: string, draft: ContactDraft) => {
    dispatch({
      type: 'update',
      contact: { ...draft, id, createdAt: '', updatedAt: new Date().toISOString() },
    });
  }, []);

  const removeContact = useCallback((id: string) => dispatch({ type: 'remove', id }), []);
  const toggleFavorite = useCallback((id: string) => dispatch({ type: 'toggleFavorite', id }), []);
  const importContacts = useCallback(
    (list: Contact[]) => dispatch({ type: 'bulkImport', contacts: list }),
    [],
  );

  const clearContacts = useCallback(() => {
    clearStorage();
    dispatch({ type: 'clear' });
  }, []);

  const resetDemo = useCallback(() => dispatch({ type: 'reset' }), []);

  const value = useMemo<ContactsContextValue>(
    () => ({
      contacts,
      addContact,
      updateContact,
      removeContact,
      toggleFavorite,
      importContacts,
      clearContacts,
      resetDemo,
    }),
    [contacts, addContact, updateContact, removeContact, toggleFavorite, importContacts, clearContacts, resetDemo],
  );

  return <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>;
}

export function useContacts(): ContactsContextValue {
  const ctx = useContext(ContactsContext);
  if (!ctx) throw new Error('useContacts 必须在 ContactsProvider 内使用');
  return ctx;
}
