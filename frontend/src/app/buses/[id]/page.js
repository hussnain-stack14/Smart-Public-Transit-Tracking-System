import BusDetailsRouteClient from "../../../components/bus/BusDetailsRouteClient";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Bus ${id} | Smart Transit Faisalabad`,
    description: "View live location, ETA and service information for a transit bus.",
  };
}

export default async function BusDetailsRoute({ params }) {
  const { id } = await params;
  return <BusDetailsRouteClient busId={id} />;
}
