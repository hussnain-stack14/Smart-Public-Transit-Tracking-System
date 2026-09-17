import DriverDashboardClient from "../../../components/driver/DriverDashboardClient";

export const metadata = {
  title: "Driver Dashboard | Smart Transit Faisalabad",
  description: "Manage assigned bus operations and live location updates.",
};

export default function DriverDashboardRoute() {
  return <DriverDashboardClient />;
}
