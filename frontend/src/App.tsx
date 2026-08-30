import { Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Entries from "@/pages/Entries";
import Cards from "@/pages/Cards";
import Annual from "@/pages/Annual";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/lancamentos" element={<Entries />} />
      <Route path="/cartoes" element={<Cards />} />
      <Route path="/anual" element={<Annual />} />
    </Routes>
  );
}
