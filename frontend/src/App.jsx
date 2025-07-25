import {Route, Routes} from "react-router-dom";
import PublicRoute from "./pages/PublicRoute";
import ProtectedRoute from "./pages/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import ProfilePage from "./pages/ProfilePage";

import './App.css'

function App() {
  return (
    <>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/auth" element={<AuthPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/settings" element={<></>} />
          <Route path="/messages" element={<></>} />
          <Route path='/:username' element={<ProfilePage/>} />
          <Route path='/' element={<HomePage />} />
          <Route path='/explore' element={<ExplorePage />} />
        </Route>

      </Routes>
    </>
  )
}

export default App
