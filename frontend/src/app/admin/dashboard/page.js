import AdminDashboardClient from "../../../components/admin/AdminDashboardClient";

export const metadata = {
  title: "Admin Dashboard | Smart Transit Faisalabad",
  description: "Administrative console for fleet operations, route analytics, incident reports, and real-time transit telemetry.",
};

export default function AdminDashboardRoute() {
  return <AdminDashboardClient />;
}
