import LiveMapRouteClient from "../../components/live-map/LiveMapRouteClient";

export const metadata = {
  title: "Live Map | Smart Transit Faisalabad",
  description: "Track active buses, stops and routes across Faisalabad.",
};

export default function LiveMapRoute() {
  return <LiveMapRouteClient />;
}
