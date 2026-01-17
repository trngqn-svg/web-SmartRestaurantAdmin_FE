import { Outlet } from "react-router-dom";
import TopRightDrawer from '../components/TopRightDrawer';

export default function StaffLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex flex-col flex-1">
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      <div className="min-h-screen bg-gray-50">
        <TopRightDrawer />
      </div>
    </div>
  );
}
