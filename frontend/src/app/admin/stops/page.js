import StopManagementClient from "../../../components/admin/stops/StopManagementClient";

export const metadata = {
  title: "Stop Management | Smart Transit Faisalabad",
  description: "Manage transit stops, coordinates, and route associations.",
};

export default function StopManagementRoute() {
  return <StopManagementClient />;
}
