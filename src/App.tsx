import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ContactListPage from './features/contacts/ContactListPage';
import ContactDetailPage from './features/contacts/ContactDetailPage';
import ContactFormPage from './features/contacts/ContactFormPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ContactListPage />} />
        <Route path="contacts/new" element={<ContactFormPage mode="create" />} />
        <Route path="contacts/:id" element={<ContactDetailPage />} />
        <Route path="contacts/:id/edit" element={<ContactFormPage mode="edit" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
