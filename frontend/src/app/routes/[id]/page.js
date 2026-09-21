import RouteDetailsRouteClient from "../../../components/route/RouteDetailsRouteClient";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Route ${id} | Smart Safar Faisalabad`,
    description: "View route stops, active buses and live transit information.",
  };
}

export default async function RouteDetailsRoute({ params }) {
  const { id } = await params;
  return <RouteDetailsRouteClient routeId={id} />;
}
