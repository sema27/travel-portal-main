import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Home from "@/pages/Home";
import Tours from "@/pages/Tours";
import TourDetail from "@/pages/TourDetail";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";

function Layout({ children }) {
    const location = useLocation();
    const isAdmin = location.pathname.startsWith("/admin") || location.pathname === "/giris";
    return (
        <div className="min-h-screen flex flex-col">
            {!isAdmin && <Navbar />}
            <div className="flex-1">{children}</div>
            {!isAdmin && <Footer />}
        </div>
    );
}

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <AuthProvider>
                    <Toaster position="top-right" richColors closeButton />
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/turlar" element={<Tours />} />
                            <Route path="/turlar/:slug" element={<TourDetail />} />
                            <Route path="/hakkimizda" element={<About />} />
                            <Route path="/iletisim" element={<Contact />} />
                            <Route path="/giris" element={<Login />} />
                            <Route path="/admin/*" element={<Admin />} />
                        </Routes>
                    </Layout>
                </AuthProvider>
            </BrowserRouter>
        </div>
    );
}

export default App;
